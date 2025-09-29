import { parse } from "date-fns";
import { resolveProperty, resolveRules } from "../conditions";
import { isPivateValue, isValueMasked, type PrivateValue } from "../private";
import {
  type Enum,
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
  type DateString,
  ErrorCode,
  type Schema,
  SchemaType,
  type SchemaValues,
  type ValidateOptions,
  type ValidateRuleContextUnion,
  type ValidationResult,
  type ValueType,
} from "../types";
import { coerceSchema } from "../utils";

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
  if (resolveProperty(schema, "required", path, true, context) && newValue === undefined) {
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
 * Validates whether the value is of the correct type
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 * @returns true if the type is correct, false if not
 */
export function validateType<T extends Schema>(
  schema: T,
  value: unknown,
  dateFormat?: string
): value is ValueType<T["type"]> {
  switch (schema.type) {
    case SchemaType.NUMBER:
      return isNumber(value);
    case SchemaType.OBJECT:
      return isObject(value);
    case SchemaType.STRING:
      return isString(value);
    case SchemaType.BOOLEAN:
      return isBoolean(value);
    case SchemaType.DATE:
      return isDate(value);
    case SchemaType.ARRAY:
      return isArray(value);
    case SchemaType.FILE:
      return isFile(value);
    case SchemaType.ENUM:
      return isEnum(schema.enum, value);
    case SchemaType.DATE_STRING: {
      if (dateFormat === undefined) {
        throw new Error("No date format supplied for date string type");
      }

      return isDateString(value, dateFormat);
    }
    case SchemaType.OPTIONS:
      // TODO: Validate if value is actually one of the options in the schema
      return isNumber(value) || isString(value) || isBoolean(value);
  }
}

/**
 * Shallow validation whether the value is of the correct type
 *
 * It only checks the primitive type and does not validate e.g. if an enum value is actually part of the enum
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 * @returns true if the type is correct, false if not
 */
export function validateShallowType<T extends SchemaType>(type: T, value: unknown): value is ValueType<T> {
  switch (type) {
    case SchemaType.NUMBER:
      return isNumber(value);
    case SchemaType.OBJECT:
      return isObject(value);
    case SchemaType.STRING:
      return isString(value);
    case SchemaType.BOOLEAN:
      return isBoolean(value);
    case SchemaType.DATE:
      return isDate(value);
    case SchemaType.ARRAY:
      return isArray(value);
    case SchemaType.FILE:
      return isFile(value);
    case SchemaType.ENUM:
      return isString(value) || isNumber(value);
    case SchemaType.DATE_STRING:
      return isString(value);
    case SchemaType.OPTIONS:
      return isNumber(value) || isString(value) || isBoolean(value);
  }
}

/**
 * Validates whether a value is an enum value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isEnum<T extends Enum>(enum_: T, value: unknown): value is T {
  return Object.values(enum_).some((v) => v === value);
}

/**
 * Validates whether a value is a string value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Validates whether a value is a number value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);
}

/**
 * Validates whether a value is a date value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime()) && value.toString() !== "Invalid Date";
}

/**
 * Validates whether a value is a boolean value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Validates whether a value is a iterable value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
  return value != null && typeof value === "object" && Symbol.iterator in value;
}

/**
 * Validates whether a value is a file value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * Validates whether a value is an object (Record<string | number, unknown>) value. If
 * the value is e.g. an array type it will return false
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isObject(value: unknown): value is Record<string | number, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validates whether a value is an array value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Validates whether a value is a string date
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isDateString(value: unknown, format: string): value is DateString {
  const date = typeof value === "string" ? parse(value, format, new Date()) : undefined;
  return date instanceof Date && !Number.isNaN(date.getTime());
}

export function parseDateString(value: DateString, format: string): Date {
  return parse(value, format, new Date());
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
