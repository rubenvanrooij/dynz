"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports._validate = _validate;
exports.validateSchema = validateSchema;
exports.validateType = validateType;
exports.assertSchema = assertSchema;
exports.assertType = assertType;
exports.isString = isString;
exports.isNumber = isNumber;
exports.isDate = isDate;
exports.isBoolean = isBoolean;
exports.isObject = isObject;
exports.isArray = isArray;
exports.assertNumber = assertNumber;
exports.assertObject = assertObject;
exports.assertArray = assertArray;
exports.assertString = assertString;
exports.assertDateString = assertDateString;
exports.isDateString = isDateString;
exports.parseDateString = parseDateString;
exports.isValueMasked = isValueMasked;
const date_fns_1 = require("date-fns");
const resolve_1 = require("./resolve");
const types_1 = require("./types");
function validate(schema, currentValues, newValues, options = {}) {
    return _validate(schema, { current: currentValues, new: newValues }, '$', {
        type: 'validate',
        schema,
        validateOptions: options,
        validateMutable: currentValues !== undefined,
        values: {
            current: currentValues,
            new: newValues,
        },
    });
}
function _validate(schema, values, path, context) {
    /**
     * If the schema is not included we do not need to validate it
     */
    if (!(0, resolve_1.resolveProperty)(schema, 'included', path, true, context)) {
        if (values.new !== undefined) {
            return {
                success: false,
                errors: [
                    {
                        path,
                        schema,
                        value: values.new,
                        current: values.current,
                        customCode: types_1.ErrorCode.INCLUDED,
                        code: types_1.ErrorCode.INCLUDED,
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
    const newValue = getValue(schema, path, values.new);
    const currentValue = getValue(schema, path, values.current);
    /**
     * if the schema is marked as not mutable; the value shuld still be the same
     */
    if (context.validateMutable &&
        (0, resolve_1.resolveProperty)(schema, 'mutable', path, true, context) === false) {
        if (valueChanged(schema, path, values.current, values.new)) {
            return {
                success: false,
                errors: [
                    {
                        path,
                        schema,
                        value: values.new,
                        current: values.current,
                        customCode: types_1.ErrorCode.IMMUTABLE,
                        code: types_1.ErrorCode.IMMUTABLE,
                        message: `The value for a schema that is not mutable has changed: ${path}`,
                    },
                ],
            };
        }
    }
    /**
     * Validate required
     */
    if ((0, resolve_1.resolveProperty)(schema, 'required', path, true, context) &&
        newValue === undefined) {
        return {
            success: false,
            errors: [
                {
                    path,
                    schema,
                    value: newValue,
                    current: currentValue,
                    customCode: types_1.ErrorCode.REQRUIED,
                    code: types_1.ErrorCode.REQRUIED,
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
            customCode: types_1.ErrorCode.TYPE,
            code: types_1.ErrorCode.TYPE,
        };
        return {
            success: false,
            errors: [
                schema.type === types_1.SchemaType.DATE_STRING
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
        for (const rule of (0, resolve_1.resolveRules)(schema, path, context)) {
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
    if (schema.type === types_1.SchemaType.OBJECT) {
        if (!isObject(newValue)) {
            throw new Error(`new value is not an object: ${newValue}`);
        }
        if (currentValue !== undefined && !isObject(currentValue)) {
            throw new Error(`current value is not an object: ${currentValue}`);
        }
        return Object.entries(schema.fields).reduce((acc, [key, innerSchema]) => {
            const result = _validate(innerSchema, {
                current: currentValue && currentValue[key],
                new: newValue[key],
            }, `${path}.${key}`, context);
            if (acc.success && result.success) {
                return {
                    success: true,
                    values: { ...acc.values, [key]: result.values },
                };
            }
            return {
                success: false,
                errors: [
                    ...(acc.success === true ? [] : acc.errors),
                    ...(result.success === true ? [] : result.errors),
                ],
            };
        }, { success: true, values: {} });
    }
    /**
     * Validate array
     */
    if (schema.type === types_1.SchemaType.ARRAY) {
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
        return newValue.reduce((acc, cur, index) => {
            const result = _validate(schema.schema, {
                current: currentValue && currentValue[index],
                new: cur,
            }, `${path}.[${index}]`, newContext);
            if (acc.success && result.success) {
                acc.values.push(result.values);
                return acc;
            }
            return {
                success: false,
                errors: [
                    ...(acc.success === true ? [] : acc.errors),
                    ...(result.success === true ? [] : result.errors),
                ],
            };
        }, { success: true, values: [] });
    }
    return {
        success: true,
        values: newValue,
    };
}
function validateRule(schema, path, rule, value, context) {
    switch (rule.type) {
        case types_1.RuleType.EQUALS:
            return validateEqualsRule(schema, path, rule, value, context);
        case types_1.RuleType.MIN:
            return validateMinRule(schema, path, rule, value, context);
        case types_1.RuleType.MAX:
            return validateMaxRule(schema, path, rule, value, context);
        case types_1.RuleType.MAX_PRECISION:
            return validateMaxPrecision(schema, path, rule, value, context);
        case types_1.RuleType.REGEX:
            return validateRegex(rule, value);
        case types_1.RuleType.IS_NUMERIC:
            return validateIsNumeric(value);
        case types_1.RuleType.CUSTOM:
            return validateCustomRule(schema, path, rule, value, context);
    }
}
/**
 * Custom rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateCustomRule(schema, path, rule, value, context) {
    const validatorFn = context.validateOptions.customRules?.[rule.name];
    if (validatorFn === undefined) {
        throw new Error(`Custom rule "${rule.name}" is not defined in the custom rules map.`);
    }
    // unpack all references in the rule
    const unpackedParams = Object.entries(rule.params).reduce((acc, [key, valueOrRef]) => {
        acc[key] = (0, resolve_1.unpackRefValue)(valueOrRef, path, context);
        return acc;
    }, {});
    const result = validatorFn({
        schema: schema,
        value: value,
    }, unpackedParams, path, schema);
    return result === true
        ? undefined
        : {
            message: `The value for schema ${path} did not pass the custom validation rule "${rule.name}"`, // Message can be overridden by custom function
            ...(typeof result !== 'boolean'
                ? { ...result, success: undefined }
                : {}),
            code: types_1.ErrorCode.CUSTOM,
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
function validateEqualsRule(_, path, rule, value, context) {
    const equals = (0, resolve_1.unpackRefValue)(rule.value, path, context);
    return equals === value
        ? undefined
        : {
            code: types_1.ErrorCode.EQUALS,
            equals: equals,
            message: `The value for schema ${path} does not equal ${equals}`,
        };
}
/**
 * Min rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateMinRule(schema, path, rule, value, context) {
    const min = (0, resolve_1.unpackRefValue)(rule.min, path, context);
    if (min === undefined) {
        return undefined;
    }
    if (!isNumber(min) && !isString(min)) {
        throw new Error(`min is not a number or string value ${min}`);
    }
    switch (schema.type) {
        case types_1.SchemaType.NUMBER:
            return assertSchema(schema, value) >= assertNumber(min) ? undefined : {
                code: types_1.ErrorCode.MIN,
                min,
                message: `The value ${value} for schema ${path} is less than the minimum value of ${min}`,
            };
        case types_1.SchemaType.STRING:
            return assertSchema(schema, value).length >= assertNumber(min) ? undefined : {
                code: types_1.ErrorCode.MIN,
                min,
                message: `The value ${value} for schema ${path} shuld have at least ${min} characters`,
            };
        case types_1.SchemaType.OBJECT:
            return Object.keys(assertSchema(schema, value)).length >= assertNumber(min) ? undefined : {
                code: types_1.ErrorCode.MIN,
                min,
                message: `The value ${value} for schema ${path} should have at least ${min} keys`,
            };
        case types_1.SchemaType.ARRAY:
            return assertSchema(schema, value).length >= assertNumber(min) ? undefined : {
                code: types_1.ErrorCode.MIN,
                min,
                message: `The value ${value} for schema ${path} should hold at least ${min} items`,
            };
        case types_1.SchemaType.DATE_STRING: {
            const date = parseDateString(assertSchema(schema, value), schema.format);
            const compareTo = parseDateString(assertSchema(schema, min), schema.format);
            return (0, date_fns_1.isAfter)(date, compareTo) || date.getTime() === compareTo.getTime() ? undefined : {
                code: types_1.ErrorCode.MIN,
                min,
                message: `The value ${value} for schema ${path} is before ${min}`,
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
function validateMaxRule(schema, path, rule, value, context) {
    const max = (0, resolve_1.unpackRefValue)(rule.max, path, context);
    if (!isNumber(max) && !isString(max)) {
        throw new Error('max is not a number or string value');
    }
    const validate = () => {
        switch (schema.type) {
            case types_1.SchemaType.NUMBER:
                return assertSchema(schema, value) <= assertNumber(max);
            case types_1.SchemaType.STRING:
                return assertSchema(schema, value).length <= assertNumber(max);
            case types_1.SchemaType.OBJECT:
                return (Object.keys(assertSchema(schema, value)).length <= assertNumber(max));
            case types_1.SchemaType.ARRAY:
                return assertSchema(schema, value).length <= assertNumber(max);
            case types_1.SchemaType.DATE_STRING: {
                const date = parseDateString(assertSchema(schema, value), schema.format);
                const compareTo = parseDateString(assertSchema(schema, max), schema.format);
                return ((0, date_fns_1.isBefore)(date, compareTo) || date.getTime() === compareTo.getTime());
            }
        }
        throw new Error(`Max rule cannot be used on schema of type: ${schema.type}`);
    };
    return validate()
        ? undefined
        : {
            code: types_1.ErrorCode.MAX,
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
function validateIsNumeric(value) {
    const assertedValue = assertString(value);
    return !Number.isNaN(assertedValue) && !Number.isNaN(+assertedValue)
        ? undefined
        : {
            code: types_1.ErrorCode.IS_NUMERIC,
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
function validateMaxPrecision(_, path, rule, value, context) {
    const maxPrecision = assertNumber((0, resolve_1.unpackRefValue)(rule.max, path, context));
    const precision = getPrecision(assertNumber(value));
    return maxPrecision <= precision
        ? undefined
        : {
            code: types_1.ErrorCode.MAX_PRECISION,
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
function validateRegex(rule, value) {
    const regex = new RegExp(rule.regex);
    return regex.test(assertString(value))
        ? undefined
        : {
            code: types_1.ErrorCode.REGEX,
            regex: rule.regex,
            message: `The value ${value} does not match the regex ${rule.regex}`,
        };
}
/**
 * Validates whether the value is of the correct type
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 * @returns true if the type is correct, false if not
 */
function validateSchema(schema, value) {
    return schema.type === types_1.SchemaType.DATE_STRING
        ? validateType(schema.type, value, schema.format)
        : validateType(schema.type, value);
}
function validateType(type, value, dateFormat) {
    switch (type) {
        case types_1.SchemaType.NUMBER:
            return isNumber(value);
        case types_1.SchemaType.OBJECT:
            return isObject(value);
        case types_1.SchemaType.STRING:
            return isString(value);
        case types_1.SchemaType.BOOLEAN:
            return isBoolean(value);
        case types_1.SchemaType.DATE:
            return isDate(value);
        case types_1.SchemaType.ARRAY:
            return isArray(value);
        case types_1.SchemaType.DATE_STRING: {
            if (dateFormat === undefined) {
                throw new Error('No date format supplied for date string type');
            }
            return isDateString(value, dateFormat);
        }
        case types_1.SchemaType.OPTIONS:
            return isNumber(value) || isString(value) || isBoolean(value);
    }
}
/**
 * Makes sure that a value is of a certain type; if not it throws an error
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 */
function assertSchema(schema, value) {
    if (validateSchema(schema, value)) {
        return value;
    }
    throw new Error(`Invalid value: ${value} for schema type: ${schema.type}`);
}
function assertType(type, value, dateFormat) {
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
function isString(value) {
    return typeof value === 'string';
}
/**
 * Validates whether a value is a number value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
function isNumber(value) {
    return (typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value));
}
/**
 * Validates whether a value is a date value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
function isDate(value) {
    return (value instanceof Date &&
        !isNaN(value.getTime()) &&
        value.toString() !== 'Invalid Date');
}
/**
 * Validates whether a value is a boolean value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
function isBoolean(value) {
    return typeof value === 'boolean';
}
/**
 * Validates whether a value is an object (Record<string | number, unknown>) value. If
 * the value is e.g. an array type it will return false
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
function isObject(value) {
    return typeof value === 'object' && !Array.isArray(value);
}
/**
 * Validates whether a value is an array value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
function isArray(value) {
    return Array.isArray(value);
}
function assertNumber(value) {
    return assertType(types_1.SchemaType.NUMBER, value);
}
function assertObject(value) {
    return assertType(types_1.SchemaType.OBJECT, value);
}
function assertArray(value) {
    return assertType(types_1.SchemaType.ARRAY, value);
}
function assertString(value) {
    return assertType(types_1.SchemaType.STRING, value);
}
function assertDateString(value, format) {
    return assertType(types_1.SchemaType.DATE_STRING, value, format);
}
/**
 * Validates whether a value is a string date
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
function isDateString(value, format) {
    const date = typeof value === 'string' ? (0, date_fns_1.parse)(value, format, new Date()) : undefined;
    return date instanceof Date && !isNaN(date.getTime());
}
function parseDateString(value, format) {
    return (0, date_fns_1.parse)(value, format, new Date());
}
/**
 * Returns the precision of a number
 * e.g. 1.23 resolves in a precision of 2
 *
 * @param value the number value the precision needs to be determined for
 * @returns the precision
 */
function getPrecision(value) {
    return (value.toString().split('.')[1] || '').length;
}
/**
 * Determines based on the schema and the current and new value whether the value has changed
 * @param schema
 * @param path
 * @param currentValue
 * @param newValue
 * @returns
 */
function valueChanged(schema, path, currentValue, newValue) {
    if (schema.private) {
        if (!isPivateValue(currentValue) || !isPivateValue(newValue)) {
            throw new Error(`Expected private values for schema ${path}, but got: currentValue=${currentValue}, newValue=${newValue}`);
        }
        return (currentValue.state === 'plain' &&
            newValue.state === 'plain' &&
            JSON.stringify(currentValue.value) !== JSON.stringify(newValue.value));
    }
    return JSON.stringify(currentValue) !== JSON.stringify(newValue);
}
function getValue(schema, path, value) {
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
function isValueMasked(schema, value) {
    if (schema.private === true) {
        return getPrivateData(value).state === 'masked';
    }
    return false;
}
function isPivateValue(value) {
    return (isObject(value) &&
        (value.state === 'masked' || value.state === 'plain') &&
        'value' in value);
}
function getPrivateData(value) {
    if (value === undefined) {
        throw new Error(`'undefined' was passed where a private value was expected; if a private value is not required it must still adhere to the following structure: { type: 'masked' | 'plain', value: undefined }. This is the only way that tracking changes is possible`);
    }
    if (!isObject(value) ||
        (value.state !== 'plain' && value.state !== 'masked')) {
        throw new Error(`value does not represent a masked value: ${value}`);
    }
    if (value.state === 'masked') {
        return {
            state: 'masked',
            value: assertString(value.value),
        };
    }
    return {
        state: value.state,
        value: value.value,
    };
}
