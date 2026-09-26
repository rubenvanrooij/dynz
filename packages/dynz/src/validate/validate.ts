import { resolveProperty, resolveRules } from "../conditions";
import { resolve } from "../functions";
import { isPrivateSchema, resolvePrivateValues } from "../private";
import { validateRule } from "../rules";
import {
  type Context,
  ErrorCode,
  type ErrorMessage,
  type Schema,
  SchemaType,
  type SchemaValues,
  type ValidateOptions,
  type ValidateRuleContextUnion,
  type ValidationResult,
  type ValidationSuccesResult,
} from "../types";
import { coerceSchema, withDefault } from "../utils";
import { isArray, isObject, validateType } from "./validate-type";

export async function validate<T extends Schema>(
  schema: T,
  currentValues: SchemaValues<T> | undefined,
  newValues: unknown,
  options: ValidateOptions = {}
): Promise<ValidationResult<SchemaValues<T>>> {
  // Private fields are unwrapped once, up front, so every reader below — rules, refs,
  // conditions, mutability — works on plain values.
  const resolved = resolvePrivateValues(schema, currentValues, newValues, currentValues !== undefined);

  const result = await _validate(schema, { current: resolved.current, new: resolved.next }, "$", {
    type: "validate",
    schema,
    validateOptions: options,
    validateMutable: currentValues !== undefined,
    currentValues: resolved.current,
    values: resolved.next,
    privateMarks: Object.fromEntries(resolved.marks.map((mark) => [mark.path, mark])),
  });

  if (result.success) {
    return result as ValidationResult<SchemaValues<T>>;
  }

  return {
    success: false,
    errors: result.errors.map((error) => (isPrivateSchema(error.schema) ? redactPrivateError(error) : error)),
  };
}

/**
 * Never echo a private field's submitted or stored value back in an error: not in
 * `value`/`current`, and not inside a rule's message (e.g. "The value … does not match").
 */
function redactPrivateError(error: ErrorMessage): ErrorMessage {
  const secrets = [error.value, error.current]
    .filter((value) => value !== undefined && value !== null && String(value) !== "")
    .map(String);

  return {
    ...error,
    value: undefined,
    current: undefined,
    message: secrets.reduce((message, secret) => message.split(secret).join("***"), error.message),
  };
}

export async function _validate<T extends Schema>(
  schema: T,
  values: { current: unknown; new: unknown },
  path: string,
  context: Context
): Promise<ValidationResult<unknown>> {
  /**
   * If the schema is not included we do not need to validate it
   */
  if (!resolveProperty("included", path, true, context)) {
    if (context.validateOptions.stripNotIncludedValues === true) {
      return {
        success: true,
        values: undefined,
      };
    }

    if (isDefined(values.new)) {
      return {
        success: false,
        errors: [
          {
            path,
            schema,
            value: values.new,
            current: values.current,
            customCode: ErrorCode.INCLUDED,
            code: ErrorCode.INCLUDED,
            message: `A value is present for a schema that is not included: ${path}`,
          },
        ],
      };
    }

    return {
      success: true,
      values: undefined,
    };
  }

  // static schema types must be in front of validation
  if (schema.type === SchemaType.EXPRESSION) {
    return {
      success: true,
      values: resolve(schema.value, path, context),
    };
  }

  // A private field `resolvePrivateValues` could not turn into a plain value: either an
  // untouched masked field with nothing to substitute (pass the marker on unvalidated),
  // or a masked value submitted where nothing is stored.
  const privateMark = context.privateMarks?.[path];

  if (privateMark?.kind === "masked") {
    return {
      success: true,
      values: privateMark.marker,
    };
  }

  if (privateMark?.kind === "missing") {
    return {
      success: false,
      errors: [
        {
          path,
          schema,
          value: undefined,
          current: undefined,
          customCode: ErrorCode.MASKED,
          code: ErrorCode.MASKED,
          message: `A masked value was submitted for ${path}, but no stored value exists`,
        },
      ],
    };
  }

  // Empty (undefined/null) values fall back to the schema default, so defaults reach
  // `required`, type checks, rules, and output — not just other fields' references
  // (see `withDefault`). Mutability check below still uses raw `values.current`/`new`
  // to distinguish "resubmitted same value" from "value was masked".
  const newValue = coerceSchema(schema, withDefault(schema, values.new));
  const currentValue = withDefault(schema, values.current);

  /**
   * if the schema is marked as not mutable; the value shuld still be the same
   */
  if (context.validateMutable && resolveProperty("mutable", path, true, context) === false) {
    if (valueChanged(values.current, values.new)) {
      return {
        success: false,
        errors: [
          {
            path,
            schema,
            value: values.new,
            current: values.current,
            customCode: ErrorCode.IMMUTABLE,
            code: ErrorCode.IMMUTABLE,
            message: `The value for a schema that is not mutable has changed: ${path}`,
          },
        ],
      };
    }
  }

  const isRequired = resolveProperty("required", path, true, context);

  /**
   * Validate required
   */
  if (isRequired && !isDefined(newValue)) {
    return {
      success: false,
      errors: [
        {
          path,
          schema,
          value: newValue,
          current: currentValue,
          customCode: ErrorCode.REQRUIED,
          code: ErrorCode.REQRUIED,
          message: `A required value is missing for schema: ${path}`,
        },
      ],
    };
  }

  /**
   * Early opt-out if not required and value is undefined; else we'll get validation errors later on
   */
  if (isRequired === false && !isDefined(newValue)) {
    return {
      success: true,
      values: undefined,
    };
  }

  /**
   * Type check
   */
  if (isDefined(newValue) && validateType(schema, newValue, path, context) === false) {
    const error = {
      path,
      schema,
      value: newValue,
      current: currentValue,
      customCode: ErrorCode.TYPE,
      code: ErrorCode.TYPE,
    } as const;

    return {
      success: false,
      errors: [
        {
          ...error,
          expectedType: schema.type,
          message: `The value for schema ${path} is not of type ${schema.type}`,
        },
      ],
    };
  }

  /**
   * Check rules
   */
  if (isDefined(newValue)) {
    for (const rule of resolveRules(schema, path, context)) {
      const result = await validateRule({
        type: schema.type,
        ruleType: rule.type,
        schema,
        path,
        rule,
        value: newValue,
        context,
      } as unknown as ValidateRuleContextUnion<T>);

      if (result !== undefined) {
        return {
          success: false,
          errors: [
            {
              ...result,
              schema,
              path,
              customCode: rule.code ? rule.code : result.code,
              value: newValue,
              current: currentValue,
            },
          ],
        };
      }
    }
  }

  /**
   * Validate nested fields on object
   */
  if (schema.type === SchemaType.OBJECT) {
    if (!isObject(newValue)) {
      throw new Error(`new value is not an object: ${newValue}`);
    }

    if (isDefined(currentValue) && !isObject(currentValue)) {
      throw new Error(`current value is not an object: ${currentValue}`);
    }

    const entries = await Promise.all(
      Object.entries(schema.fields).map(async ([key, innerSchema]) => ({
        key,
        result: await _validate(
          innerSchema,
          { current: currentValue?.[key], new: newValue[key] },
          `${path}.${key}`,
          context
        ),
      }))
    );

    let acc = { success: true, values: {} } as ValidationResult<Record<string, unknown>>;

    for (const { key, result } of entries) {
      if (acc.success) {
        if (result.success) {
          acc.values[key] = result.values;
        } else {
          acc = { success: false, errors: result.errors };
        }
      } else if (!result.success) {
        acc.errors.push(...result.errors);
      }
    }

    return acc;

    // return Object.entries(schema.fields).reduce<ValidationResult<Record<string, unknown>>>(
    //   (acc, [key, innerSchema]) => {
    //     const result = await _validate(
    //       innerSchema,
    //       {
    //         current: currentValue?.[key],
    //         new: newValue[key],
    //       },
    //       `${path}.${key}`,
    //       context
    //     );

    //     if (acc.success) {
    //       if (result.success) {
    //         acc.values[key] = result.values;
    //         return acc;
    //       }

    //       return {
    //         success: false,
    //         errors: result.errors,
    //       };
    //     }

    //     if (result.success) {
    //       return acc;
    //     }

    //     acc.errors.push(...result.errors);
    //     return acc;
    //   },
    //   { success: true, values: {} }
    // );
  }

  /**
   * Validate array
   */
  if (schema.type === SchemaType.ARRAY) {
    if (!isArray(newValue)) {
      throw new Error(`new value is not an array: ${newValue}`);
    }

    if (isDefined(currentValue) && !isArray(currentValue)) {
      throw new Error(`current value is not an array: ${currentValue}`);
    }

    const newContext = {
      ...context,
      // We do not validate mutable values in arrays, as they are always mutable
      validateMutable: false,
    };

    const results = await Promise.all(
      newValue.map((cur: unknown, index: number) =>
        _validate(
          schema.schema,
          {
            current: currentValue?.[index],
            new: cur,
          },
          `${path}.[${index}]`,
          newContext
        )
      )
    );

    let acc = { success: true, values: [] } as ValidationResult<unknown[]>;

    for (const result of results) {
      if (acc.success) {
        if (result.success) {
          acc.values.push(result.values);
        } else {
          acc = { success: false, errors: result.errors };
        }
      } else if (!result.success) {
        acc.errors.push(...result.errors);
      }
    }

    return acc;
  }

  /**
   * Validate discriminated union - find the matching member by the discriminator key value.
   */
  if (schema.type === SchemaType.DISCRIMINATED_UNION) {
    if (!isObject(newValue)) {
      throw new Error(`new value is not an object: ${newValue}`);
    }

    if (isDefined(currentValue) && !isObject(currentValue)) {
      throw new Error(`current value is not an object: ${currentValue}`);
    }

    const discriminatorValue = newValue[schema.key];
    const matchingMember = schema.schemas.find((s) => s[schema.key] === discriminatorValue);

    if (matchingMember === undefined) {
      return {
        success: false,
        errors: [
          {
            path,
            schema,
            value: newValue,
            current: currentValue,
            customCode: ErrorCode.TYPE,
            code: ErrorCode.TYPE,
            expectedType: schema.type,
            message: `The value for schema ${path} does not match any member of the discriminated union (key: ${schema.key}=${String(discriminatorValue)})`,
          },
        ],
      };
    }

    const entries = await Promise.all(
      Object.entries(matchingMember).map(async ([key, innerSchema]) => {
        if (typeof innerSchema === "string" || typeof innerSchema === "boolean" || typeof innerSchema === "number") {
          return {
            key,
            result: {
              success: true,
              values: innerSchema,
            } as ValidationSuccesResult<unknown>,
          };
        }

        return {
          key,
          result: await _validate(
            innerSchema,
            { current: currentValue?.[key], new: newValue[key] },
            `${path}.${key}`,
            context
          ),
        };
      })
    );

    let acc = { success: true, values: {} } as ValidationResult<Record<string, unknown>>;

    for (const { key, result } of entries) {
      if (acc.success) {
        if (result.success) {
          acc.values[key] = result.values;
        } else {
          acc = { success: false, errors: result.errors };
        }
      } else if (!result.success) {
        acc.errors.push(...result.errors);
      }
    }

    return acc;
  }

  return {
    success: true,
    values: newValue,
  };
}

/**
 * Returns the precision of a number
 * e.g. 1.23 resolves in a precision of 2
 *
 * @param value the number value the precision needs to be determined for
 * @returns the precision
 */
// function getPrecision(value: number): number {
//   return (value.toString().split(".")[1] || "").length;
// }

/**
 * Whether a value has changed between the current and new document. Private values are
 * already resolved to plain values by the time this runs.
 */
function valueChanged(currentValue: unknown, newValue: unknown): boolean {
  return JSON.stringify(currentValue) !== JSON.stringify(newValue);
}

function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
