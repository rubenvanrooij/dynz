import { resolveProperty, resolveRules } from "../conditions";
import { isPivateValue, isValueMasked, type PrivateValue } from "../private";
import {
  validateArray,
  validateBoolean,
  validateDate,
  validateDateString,
  validateEnum,
  validateFile,
  validateNumber,
  validateObject,
  validateOptions,
  validateString,
} from "../schemas";
import {
  type Context,
  ErrorCode,
  type Schema,
  SchemaType,
  type SchemaValues,
  type ValidateOptions,
  type ValidateRuleContextUnion,
  type ValidationResult,
} from "../types";
import { coerceSchema } from "../utils";
import { isArray, isObject, validateType } from "./validate-type";

export function validate<T extends Schema>(
  schema: T,
  currentValues: SchemaValues<T> | undefined,
  newValues: unknown,
  options: ValidateOptions = {}
): ValidationResult<SchemaValues<T>> {
  return _validate(schema, { current: currentValues, new: newValues }, "$", {
    type: "validate",
    schema,
    validateOptions: options,
    validateMutable: currentValues !== undefined,
    values: {
      current: currentValues,
      new: newValues,
    },
  }) as ValidationResult<SchemaValues<T>>;
}

export function _validate<T extends Schema>(
  schema: T,
  values: { current: unknown; new: unknown },
  path: string,
  context: Context
): ValidationResult<unknown> {
  /**
   * If the schema is not included we do not need to validate it
   */
  if (!resolveProperty(schema, "included", path, true, context)) {
    if (context.validateOptions.stripNotIncludedValues === true) {
      return {
        success: true,
        values: undefined,
      };
    }

    if (values.new !== undefined) {
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

  // If the new value is masked; skip all validation and return the value immediately
  if (isValueMasked(schema, values.new)) {
    return {
      success: true,
      values: values.new,
    };
  }

  const newValue = coerceSchema(schema, getValue(schema, path, values.new));
  const currentValue = getValue(schema, path, values.current);

  /**
   * if the schema is marked as not mutable; the value shuld still be the same
   */
  if (context.validateMutable && resolveProperty(schema, "mutable", path, true, context) === false) {
    if (valueChanged(schema, path, values.current, values.new)) {
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

  /**
   * Validate required
   */
  const isRequired = resolveProperty(schema, "required", path, true, context);
  if (isRequired && newValue === undefined) {
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
  if (!isRequired && newValue === undefined) {
    return {
      success: true,
      values: undefined,
    };
  }

  /**
   * Type check
   */
  if (newValue !== undefined && validateType(schema, newValue) === false) {
    const error = {
      path,
      schema,
      value: newValue,
      current: currentValue,
      customCode: ErrorCode.TYPE,
      code: ErrorCode.TYPE,
    };

    return {
      success: false,
      errors: [
        schema.type === SchemaType.DATE_STRING
          ? {
              ...error,
              expectedType: schema.type,
              expectedFormat: schema.format,
              message: `The value for schema ${path} is not a valid date string in the format ${schema.format}`,
            }
          : {
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
  if (newValue !== undefined) {
    for (const rule of resolveRules(schema, path, context)) {
      const result = validateRule({
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

    if (currentValue !== undefined && !isObject(currentValue)) {
      throw new Error(`current value is not an object: ${currentValue}`);
    }

    return Object.entries(schema.fields).reduce<ValidationResult<Record<string, unknown>>>(
      (acc, [key, innerSchema]) => {
        const result = _validate(
          innerSchema,
          {
            current: currentValue?.[key],
            new: newValue[key],
          },
          `${path}.${key}`,
          context
        );

        if (acc.success) {
          if (result.success) {
            acc.values[key] = result.values;
            return acc;
          }

          return {
            success: false,
            errors: result.errors,
          };
        }

        if (result.success) {
          return acc;
        }

        acc.errors.push(...result.errors);
        return acc;
      },
      { success: true, values: {} }
    );
  }

  /**
   * Validate array
   */
  if (schema.type === SchemaType.ARRAY) {
    if (!isArray(newValue)) {
      throw new Error(`new value is not an array: ${newValue}`);
    }

    if (currentValue !== undefined && !isArray(currentValue)) {
      throw new Error(`current value is not an array: ${currentValue}`);
    }

    const newContext = {
      ...context,
      // We do not validate mutable values in arrays, as they are always mutable
      validateMutable: false,
    };

    return newValue.reduce<ValidationResult<unknown[]>>(
      (acc, cur, index) => {
        const result = _validate(
          schema.schema,
          {
            current: currentValue?.[index],
            new: cur,
          },
          `${path}.[${index}]`,
          newContext
        );

        if (acc.success) {
          if (result.success) {
            acc.values.push(result.values);
            return acc;
          }

          return {
            success: false,
            errors: result.errors,
          };
        }

        if (result.success) {
          return acc;
        }

        acc.errors.push(...result.errors);
        return acc;
      },
      { success: true, values: [] }
    );
  }

  return {
    success: true,
    values: newValue,
  };
}

function validateRule<T extends Schema>(context: ValidateRuleContextUnion<T>) {
  switch (context.type) {
    case SchemaType.STRING:
      return validateString(context);
    case SchemaType.NUMBER:
      return validateNumber(context);
    case SchemaType.ARRAY:
      return validateArray(context);
    case SchemaType.BOOLEAN:
      return validateBoolean(context);
    case SchemaType.DATE:
      return validateDate(context);
    case SchemaType.DATE_STRING:
      return validateDateString(context);
    case SchemaType.FILE:
      return validateFile(context);
    case SchemaType.OBJECT:
      return validateObject(context);
    case SchemaType.OPTIONS:
      return validateOptions(context);
    case SchemaType.ENUM:
      return validateEnum(context);
  }
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
 * Determines based on the schema and the current and new value whether the value has changed
 * @param schema
 * @param path
 * @param currentValue
 * @param newValue
 * @returns
 */
function valueChanged<T>(
  schema: Schema,
  path: string,
  currentValue: T | PrivateValue<T>,
  newValue: T | PrivateValue<T>
): boolean {
  if (schema.private) {
    if (!isPivateValue(currentValue) || !isPivateValue(newValue)) {
      throw new Error(
        `Expected private values for schema ${path}, but got: currentValue=${currentValue}, newValue=${newValue}`
      );
    }

    return (
      currentValue.state === "plain" &&
      newValue.state === "plain" &&
      JSON.stringify(currentValue.value) !== JSON.stringify(newValue.value)
    );
  }

  return JSON.stringify(currentValue) !== JSON.stringify(newValue);
}

function getValue(schema: Schema, path: string, value: unknown): unknown {
  if (schema.private) {
    if (value === undefined) {
      return undefined;
    }

    if (!isPivateValue(value)) {
      throw new Error(`Expected a private value for schema ${path}, but got: ${value}`);
    }
    return value.value;
  }

  return value;
}
