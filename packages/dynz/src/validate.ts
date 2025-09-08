import { isAfter, isBefore, parse } from "date-fns";
import { coerce, resolveProperty, resolveRules, unpackRefValue } from "./resolve";
import {
  type AfterErrorMessage,
  type AfterRule,
  type BaseErrorMessage,
  type BeforeErrorMessage,
  type BeforeRule,
  type Context,
  type CustomErrorMessage,
  type CustomRule,
  type DateString,
  type EmailErrorMEssage,
  type EmailRule,
  type EqualsErrorMessage,
  type EqualsRule,
  ErrorCode,
  type IsNumericErrorMessage,
  type MaxErrorMessage,
  type MaxPrecisionErrorMessage,
  type MaxPrecisionRule,
  type MaxRule,
  type MimeTypeErrorMessage,
  type MimeTypeRule,
  type MinErrorMessage,
  type MinRule,
  type OneOfErrorMessage,
  type OneOfRule,
  type PrivateValue,
  type RegexErrorMessage,
  type RegexRule,
  type ResolvedRules,
  RuleType,
  type Schema,
  SchemaType,
  type SchemaValues,
  type ValidateOptions,
  type ValidationResult,
  type ValueType,
} from "./types";

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

  let newValue = getValue(schema, path, values.new);
  const currentValue = getValue(schema, path, values.current);

  // Try coercing the value
  if ("coerce" in schema && schema.coerce === true) {
    newValue = coerce(schema.type, newValue);
  }

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
  if (newValue !== undefined && validateSchema(schema, newValue) === false) {
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
      const result = validateRule(schema, path, rule, newValue, context);
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

        if (acc.success && result.success) {
          return {
            success: true,
            values: result.values !== undefined ? { ...acc.values, [key]: result.values } : acc.values,
          };
        }

        return {
          success: false,
          errors: [...(acc.success === true ? [] : acc.errors), ...(result.success === true ? [] : result.errors)],
        };
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

        if (acc.success && result.success) {
          acc.values.push(result.values);
          return acc;
        }

        return {
          success: false,
          errors: [...(acc.success === true ? [] : acc.errors), ...(result.success === true ? [] : result.errors)],
        };
      },
      { success: true, values: [] }
    );
  }

  return {
    success: true,
    values: newValue,
  };
}

function validateRule<T extends Schema>(
  schema: T,
  path: string,
  rule: ResolvedRules,
  value: ValueType<T["type"]>,
  context: Context
) {
  switch (rule.type) {
    case RuleType.EQUALS:
      return validateEqualsRule(schema, path, rule, value, context);
    case RuleType.MIN:
      return validateMinRule(schema, path, rule, value, context);
    case RuleType.MAX:
      return validateMaxRule(schema, path, rule, value, context);
    case RuleType.MAX_PRECISION:
      return validateMaxPrecision(schema, path, rule, value, context);
    case RuleType.REGEX:
      return validateRegex(rule, value);
    case RuleType.IS_NUMERIC:
      return validateIsNumeric(value);
    case RuleType.CUSTOM:
      return validateCustomRule(schema, path, rule, value, context);
    case RuleType.MIME_TYPE:
      return validateMimeTypeRule(schema, path, rule, value, context);
    case RuleType.EMAIL:
      return validateEmail(rule, value);
    case RuleType.ONE_OF:
      return validateOneOfRule(rule, value);
    case RuleType.BEFORE:
      return beforeRuleValidator(schema, path, rule, value, context);
    case RuleType.AFTER:
      return afterRuleValidator(schema, path, rule, value, context);
  }
}

/**
 * Custom rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateCustomRule<T extends Schema>(
  schema: T,
  path: string,
  rule: CustomRule,
  value: ValueType<T["type"]>,
  context: Context
): Omit<CustomErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  const validatorFn = context.validateOptions.customRules?.[rule.name];

  if (validatorFn === undefined) {
    throw new Error(`Custom rule "${rule.name}" is not defined in the custom rules map.`);
  }

  // unpack all references in the rule
  const unpackedParams = Object.entries(rule.params).reduce<Record<string, unknown>>((acc, [key, valueOrRef]) => {
    acc[key] = unpackRefValue(valueOrRef, path, context);
    return acc;
  }, {});

  const result = validatorFn(
    {
      schema: schema,
      value: value,
    },
    unpackedParams,
    path,
    schema
  );

  return result === true
    ? undefined
    : {
        message: `The value for schema ${path} did not pass the custom validation rule "${rule.name}"`, // Message can be overridden by custom function
        ...(typeof result !== "boolean" ? { ...result, success: undefined } : {}),
        code: ErrorCode.CUSTOM,
        name: rule.name,
      };
}

/**
 * Equals rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateEqualsRule(
  schema: Schema,
  path: string,
  rule: EqualsRule,
  value: unknown,
  context: Context
): Omit<EqualsErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  const refOrValue = unpackRefValue(rule.value, path, context);

  switch (schema.type) {
    case SchemaType.DATE:
      return assertDate(coerce(SchemaType.DATE, refOrValue)).getTime() === assertDate(value).getTime()
        ? undefined
        : {
            code: ErrorCode.EQUALS,
            equals: refOrValue,
            message: `The value for schema ${path} does not equal ${refOrValue}`,
          };
    default: {
      return refOrValue === value
        ? undefined
        : {
            code: ErrorCode.EQUALS,
            equals: refOrValue,
            message: `The value for schema ${path} does not equal ${refOrValue}`,
          };
    }
  }
}

/**
 * Mime type rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateMimeTypeRule(
  schema: Schema,
  path: string,
  rule: MimeTypeRule,
  value: unknown,
  context: Context
): Omit<MimeTypeErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  const mimeType = unpackRefValue(rule.mimeType, path, context);

  const mimeTypes = isArray(mimeType) ? mimeType : [mimeType];

  switch (schema.type) {
    case SchemaType.FILE: {
      const assertedValue = assertSchema(schema, value);
      return mimeTypes.includes(assertedValue.type)
        ? undefined
        : {
            code: ErrorCode.MIME_TYPE,
            mimeType: assertedValue.type,
            message: `The mime type ${assertedValue.type} for schema ${path} is not equal to ${mimeType}`,
          };
    }
    default:
      throw new Error(`Mime type rule cannot be used on schema of type: ${schema.type}`);
  }
}

/**
 * Min rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateMinRule(
  schema: Schema,
  path: string,
  rule: MinRule,
  value: unknown,
  context: Context
): Omit<MinErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  switch (schema.type) {
    case SchemaType.NUMBER: {
      const compareTo = assertNumber(min);
      return assertSchema(schema, value) >= compareTo
        ? undefined
        : {
            code: ErrorCode.MIN,
            min: compareTo,
            message: `The value ${value} for schema ${path} is less than the minimum value of ${min}`,
          };
    }
    case SchemaType.FILE: {
      const asstertedValue = assertSchema(schema, value);
      const compareTo = assertNumber(min);
      return asstertedValue.size >= compareTo
        ? undefined
        : {
            code: ErrorCode.MIN,
            min: compareTo,
            message: `The value ${asstertedValue.name} for schema ${path} shuld have at least ${compareTo} bytes`,
          };
    }
    case SchemaType.STRING: {
      const compareTo = assertNumber(min);
      return assertSchema(schema, value).length >= compareTo
        ? undefined
        : {
            code: ErrorCode.MIN,
            min: compareTo,
            message: `The value ${value} for schema ${path} shuld have at least ${compareTo} characters`,
          };
    }
    case SchemaType.OBJECT: {
      const compareTo = assertNumber(min);
      return Object.keys(assertSchema(schema, value)).length >= compareTo
        ? undefined
        : {
            code: ErrorCode.MIN,
            min: compareTo,
            message: `The value ${value} for schema ${path} should have at least ${compareTo} keys`,
          };
    }
    case SchemaType.ARRAY: {
      const compareTo = assertNumber(min);
      return assertSchema(schema, value).length >= compareTo
        ? undefined
        : {
            code: ErrorCode.MIN,
            min: compareTo,
            message: `The value ${value} for schema ${path} should hold at least ${compareTo} items`,
          };
    }
    case SchemaType.DATE_STRING: {
      const date = parseDateString(assertString(value), schema.format);
      const compareTo = parseDateString(assertString(min), schema.format);
      return isAfter(date, compareTo) || date.getTime() === compareTo.getTime()
        ? undefined
        : {
            code: ErrorCode.MIN,
            min: compareTo,
            message: `The value ${value} for schema ${path} is before or on ${min}`,
          };
    }
    case SchemaType.DATE: {
      const date = assertDate(value);
      const compareTo = assertDate(coerce(schema.type, min));
      return isAfter(date, compareTo) || date.getTime() === compareTo.getTime()
        ? undefined
        : {
            code: ErrorCode.MIN,
            min: compareTo,
            message: `The value ${value} for schema ${path} is before or on ${min}`,
          };
    }
    default:
      throw new Error(`Min rule cannot be used on schema of type: ${schema.type}`);
  }
}

/**
 * Max rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateMaxRule(
  schema: Schema,
  path: string,
  rule: MaxRule,
  value: unknown,
  context: Context
): Omit<MaxErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  const max = unpackRefValue(rule.max, path, context);

  if (!isNumber(max) && !isString(max) && !isDate(max)) {
    throw new Error("max is not a number, string, or date value");
  }

  const validate = () => {
    switch (schema.type) {
      case SchemaType.NUMBER:
        return assertSchema(schema, value) <= assertNumber(max);
      case SchemaType.STRING:
        return assertSchema(schema, value).length <= assertNumber(max);
      case SchemaType.FILE:
        return assertSchema(schema, value).size <= assertNumber(max);
      case SchemaType.OBJECT:
        return Object.keys(assertSchema(schema, value)).length <= assertNumber(max);
      case SchemaType.ARRAY:
        return assertSchema(schema, value).length <= assertNumber(max);
      case SchemaType.DATE_STRING: {
        const date = parseDateString(assertSchema(schema, value), schema.format);
        const compareTo = parseDateString(assertSchema(schema, max), schema.format);
        return isBefore(date, compareTo) || date.getTime() === compareTo.getTime();
      }
      case SchemaType.DATE: {
        const date = assertSchema(schema, value);
        const compareTo = assertSchema(schema, coerce(schema.type, max));
        return isBefore(date, compareTo) || date.getTime() === compareTo.getTime();
      }
    }

    throw new Error(`Max rule cannot be used on schema of type: ${schema.type}`);
  };

  return validate()
    ? undefined
    : {
        code: ErrorCode.MAX,
        max,
        message: `The value ${value} for schema ${path} is greater than the maximum value of ${max}`,
      };
}

/**
 * Is numeric rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateIsNumeric(
  value: unknown
): Omit<IsNumericErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  const assertedValue = assertString(value);
  return !Number.isNaN(assertedValue) && !Number.isNaN(+assertedValue)
    ? undefined
    : {
        code: ErrorCode.IS_NUMERIC,
        message: `The value ${value} is not a valid numeric value`,
      };
}

/**
 * Max precision rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateMaxPrecision(
  _: Schema,
  path: string,
  rule: MaxPrecisionRule,
  value: unknown,
  context: Context
): Omit<MaxPrecisionErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  const maxPrecision = assertNumber(unpackRefValue(rule.max, path, context));
  const precision = getPrecision(assertNumber(value));
  return maxPrecision >= precision
    ? undefined
    : {
        code: ErrorCode.MAX_PRECISION,
        maxPrecision,
        message: `The value ${value} for schema ${path} has a precision of ${precision}, which is greater than the maximum precision of ${maxPrecision}`,
      };
}

/**
 * Regex rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateRegex(
  rule: RegexRule,
  value: unknown
): Omit<RegexErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  const regex = new RegExp(rule.regex);
  return regex.test(assertString(value))
    ? undefined
    : {
        code: ErrorCode.REGEX,
        regex: rule.regex,
        message: `The value ${value} does not match the regex ${rule.regex}`,
      };
}

/**
 * Email rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-.]*)[a-z0-9_'+-]@([a-z0-9][a-z0-9-]*\.)+[a-z]{2,}$/i;
function validateEmail(
  _: EmailRule,
  value: unknown
): Omit<EmailErrorMEssage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  return EMAIL_REGEX.test(assertString(value))
    ? undefined
    : {
        code: ErrorCode.EMAIL,
        message: `The value ${value} is not a valid email address`,
      };
}

/**
 * Before rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function beforeRuleValidator(
  schema: Schema,
  path: string,
  rule: BeforeRule,
  value: unknown,
  context: Context
): Omit<BeforeErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  switch (schema.type) {
    case SchemaType.DATE_STRING: {
      const date = parseDateString(assertString(value), schema.format);
      const before = assertString(unpackRefValue(rule.before, path, context));
      const compareTo = parseDateString(before, schema.format);
      return isBefore(date, compareTo)
        ? undefined
        : {
            code: ErrorCode.BEFORE,
            before: before,
            message: `The value ${value} for schema ${path} is after ${before}`,
          };
    }
    case SchemaType.DATE: {
      const date = assertDate(value);
      const before = assertDate(coerce(SchemaType.DATE, unpackRefValue(rule.before, path, context)));

      return isBefore(date, before)
        ? undefined
        : {
            code: ErrorCode.BEFORE,
            before: before,
            message: `The value ${value} for schema ${path} is after ${before}`,
          };
    }
    default:
      throw new Error(`Before rule cannot be used on schema of type: ${schema.type}`);
  }
}

/**
 * After rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function afterRuleValidator(
  schema: Schema,
  path: string,
  rule: AfterRule,
  value: unknown,
  context: Context
): Omit<AfterErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  switch (schema.type) {
    case SchemaType.DATE_STRING: {
      const date = parseDateString(assertString(value), schema.format);
      const after = assertString(unpackRefValue(rule.after, path, context));
      const compareTo = parseDateString(after, schema.format);
      return isAfter(date, compareTo)
        ? undefined
        : {
            code: ErrorCode.AFTER,
            after: after,
            message: `The value ${value} for schema ${path} is before ${after}`,
          };
    }
    case SchemaType.DATE: {
      const date = assertDate(value);
      const after = assertDate(coerce(SchemaType.DATE, unpackRefValue(rule.after, path, context)));

      return isAfter(date, after)
        ? undefined
        : {
            code: ErrorCode.AFTER,
            after: after,
            message: `The value ${value} for schema ${path} is before ${after}`,
          };
    }
    default:
      throw new Error(`Before rule cannot be used on schema of type: ${schema.type}`);
  }
}

/**
 * One off rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateOneOfRule(
  rule: OneOfRule,
  value: unknown
): Omit<OneOfErrorMessage, keyof Omit<BaseErrorMessage, "message">> | undefined {
  return rule.values.some((v) => v === value)
    ? undefined
    : {
        code: ErrorCode.ONE_OF,
        expected: rule.values,
        message: `The value ${value} is not a one of ${rule.values}`,
      };
}

/**
 * Validates whether the value is of the correct type
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 * @returns true if the type is correct, false if not
 */
export function validateSchema<T extends Schema>(schema: T, value: unknown): value is ValueType<T["type"]> {
  return schema.type === SchemaType.DATE_STRING
    ? validateType(schema.type, value, schema.format)
    : validateType(schema.type, value);
}

/**
 * Validates whether the value is of the correct type
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 * @returns true if the type is correct, false if not
 */
export function validateType<T extends Exclude<SchemaType, typeof SchemaType.DATE_STRING>>(
  type: T,
  value: unknown
): value is ValueType<T>;
export function validateType<T extends typeof SchemaType.DATE_STRING>(
  type: T,
  value: unknown,
  dateFormat: string
): value is ValueType<T>;
export function validateType<T extends SchemaType>(type: T, value: unknown, dateFormat?: string): value is ValueType<T>;
export function validateType<T extends SchemaType>(
  type: T,
  value: unknown,
  dateFormat?: string
): value is ValueType<T> {
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
    case SchemaType.DATE_STRING: {
      if (dateFormat === undefined) {
        throw new Error("No date format supplied for date string type");
      }

      return isDateString(value, dateFormat);
    }
    case SchemaType.OPTIONS:
      return isNumber(value) || isString(value) || isBoolean(value);
  }
}

/**
 * Makes sure that a value is of a certain type; if not it throws an error
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 */
export function assertSchema<T extends Schema>(schema: T, value: unknown): ValueType<T["type"]> {
  if (validateSchema(schema, value)) {
    return value;
  }

  throw new Error(`Invalid value: ${value} for schema type: ${schema.type}`);
}

/**
 * Makes sure that a value is of a certain type; if not it throws an error
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 */
export function assertType<T extends Exclude<SchemaType, typeof SchemaType.DATE_STRING>>(
  type: T,
  value: unknown
): ValueType<T>;
export function assertType<T extends typeof SchemaType.DATE_STRING>(
  type: T,
  value: unknown,
  dateFormat: string
): ValueType<T>;
export function assertType<T extends SchemaType>(type: T, value: unknown, dateFormat?: string): ValueType<T> {
  if (validateType(type, value, dateFormat)) {
    return value;
  }

  throw new Error(`Invalid type: ${typeof value} with ${value} for schema type: ${type}`);
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

export function assertNumber(value: unknown): number {
  return assertType(SchemaType.NUMBER, value);
}

export function assertObject(value: unknown): Record<string | number, unknown> {
  return assertType(SchemaType.OBJECT, value);
}

export function assertArray(value: unknown): unknown[] {
  return assertType(SchemaType.ARRAY, value);
}

export function assertString(value: unknown): string {
  return assertType(SchemaType.STRING, value);
}

export function assertDate(value: unknown): Date {
  return assertType(SchemaType.DATE, value);
}

export function assertDateString(value: unknown, format: string): DateString {
  return assertType(SchemaType.DATE_STRING, value, format);
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
function getPrecision(value: number): number {
  return (value.toString().split(".")[1] || "").length;
}

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

export function isValueMasked(schema: Schema, value: unknown): boolean {
  if (schema.private === true) {
    return getPrivateData(value).state === "masked";
  }

  return false;
}

function isPivateValue<T>(value: unknown): value is PrivateValue<T> {
  return isObject(value) && (value.state === "masked" || value.state === "plain") && "value" in value;
}

function getPrivateData(value: unknown): PrivateValue<unknown> {
  if (value === undefined) {
    throw new Error(
      `'undefined' was passed where a private value was expected; if a private value is not required it must still adhere to the following structure: { type: 'masked' | 'plain', value: undefined }. This is the only way that tracking changes is possible`
    );
  }

  if (!isObject(value) || (value.state !== "plain" && value.state !== "masked")) {
    throw new Error(`value does not represent a masked value: ${value}`);
  }

  if (value.state === "masked") {
    return {
      state: "masked",
      value: assertString(value.value),
    };
  }

  return {
    state: value.state,
    value: value.value,
  };
}
