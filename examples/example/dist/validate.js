"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports._validate = _validate;
exports.isString = isString;
exports.isNumber = isNumber;
exports.isBoolean = isBoolean;
exports.isObject = isObject;
exports.isArray = isArray;
exports.isDateString = isDateString;
exports.parseDateString = parseDateString;
exports.isValueMasked = isValueMasked;
const date_fns_1 = require("date-fns");
const resolve_1 = require("./resolve");
const types_1 = require("./types");
function validate(schema, currentValues, newValues) {
    return _validate(schema, { current: currentValues, new: newValues }, '$', {
        type: 'validate',
        schema,
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
    if (!schema.included) {
        if (values.new !== undefined) {
            return {
                success: false,
                errors: [
                    {
                        path,
                        schema,
                        value: values.new,
                        current: values.current,
                        code: types_1.ErrorCode.INCLUDED,
                    },
                ],
            };
        }
        return {
            success: true,
            values: undefined,
        };
    }
    // If the new value is masked; skip all validation and return the current value
    if (isValueMasked(schema, values.new)) {
        return {
            success: true,
            values: values.new,
        };
    }
    const newValue = getValue(schema, values.new);
    const currentValue = getValue(schema, values.current);
    /**
     * if the schema is marked as not mutable; the value shuld still be the same
     */
    if (!schema.mutable) {
        if (valueChanged(schema, values.current, values.new)) {
            return {
                success: false,
                errors: [
                    {
                        path,
                        schema,
                        value: values.new,
                        current: values.current,
                        code: types_1.ErrorCode.IMMUTABLE,
                    },
                ],
            };
        }
    }
    /**
     * Validate required
     */
    if (schema.required && newValue === undefined) {
        return {
            success: false,
            errors: [
                {
                    path,
                    schema,
                    value: newValue,
                    current: currentValue,
                    code: types_1.ErrorCode.REQRUIED,
                },
            ],
        };
    }
    /**
     * Type check
     */
    if (newValue !== undefined && validateType(schema.type, newValue) === false) {
        return {
            success: false,
            errors: [
                {
                    path,
                    schema,
                    value: newValue,
                    expectedType: schema.type,
                    current: currentValue,
                    code: types_1.ErrorCode.TYPE,
                },
            ],
        };
    }
    /**
     * Check rules
     */
    if (newValue !== undefined) {
        for (const rule of schema.rules) {
            const result = validateRule(schema, rule, newValue, context);
            if (result !== undefined) {
                return {
                    success: false,
                    errors: [
                        {
                            ...result,
                            schema,
                            path,
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
        if (!isObject(currentValue)) {
            throw new Error(`current value is not an object: ${currentValue}`);
        }
        return Object.entries(schema.fields).reduce((acc, [key, schema]) => {
            const result = _validate(schema, {
                current: currentValue[key],
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
        if (!isArray(currentValue)) {
            throw new Error(`current value is not an array: ${currentValue}`);
        }
        return newValue.reduce((acc, cur, index) => {
            const innerSchema = schema.schema[index];
            if (innerSchema === undefined) {
                throw new Error(`Schema for array at path ${path} does not have a schema for index ${index}. Schema: ${JSON.stringify(schema)}`);
            }
            const result = _validate(innerSchema, {
                current: currentValue[index],
                new: cur,
            }, `${path}[${index}]`, context);
            if (acc.success && result.success) {
                return {
                    success: true,
                    values: [...acc.values, result.values],
                };
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
function validateRule(schema, rule, value, context) {
    switch (rule.type) {
        case types_1.RuleType.EQUALS:
            return validateEqualsRule(schema, rule, value, context);
        case types_1.RuleType.MIN:
            return validateMinRule(schema, rule, value, context);
        case types_1.RuleType.MAX:
            return validateMaxRule(schema, rule, value, context);
        case types_1.RuleType.MAX_PRECISION:
            return validateMaxPrecision(schema, rule, value, context);
        case types_1.RuleType.REGEX:
            return validateRegex(rule, value);
    }
}
/**
 * Equals rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateEqualsRule(schema, rule, value, context) {
    const equals = (0, resolve_1.unpackRef)(rule.value, schema, value, context);
    return equals === value
        ? undefined
        : { code: types_1.ErrorCode.EQUALS, equals: equals };
}
/**
 * Min rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateMinRule(schema, rule, value, context) {
    const min = assertType([types_1.SchemaType.DATE_STRING, types_1.SchemaType.NUMBER], (0, resolve_1.unpackRef)(rule.min, schema, value, context));
    const validate = () => {
        switch (schema.type) {
            case types_1.SchemaType.NUMBER:
                return assertType(schema.type, value) >= (0, resolve_1.assertNumber)(min);
            case types_1.SchemaType.STRING:
                return assertType(schema.type, value).length >= (0, resolve_1.assertNumber)(min);
            case types_1.SchemaType.OBJECT:
                return (Object.keys(assertType(schema.type, value)).length >=
                    (0, resolve_1.assertNumber)(min));
            case types_1.SchemaType.ARRAY:
                return assertType(schema.type, value).length >= (0, resolve_1.assertNumber)(min);
            case types_1.SchemaType.DATE_STRING: {
                const date = parseDateString(assertType(schema.type, value));
                const compareTo = parseDateString(assertType(types_1.SchemaType.DATE_STRING, min));
                return ((0, date_fns_1.isAfter)(date, compareTo) || date.getTime() === compareTo.getTime());
            }
        }
    };
    return validate()
        ? undefined
        : {
            code: types_1.ErrorCode.MIN,
            min,
        };
}
/**
 * Max rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateMaxRule(schema, rule, value, context) {
    const max = assertType([types_1.SchemaType.DATE_STRING, types_1.SchemaType.NUMBER], (0, resolve_1.unpackRef)(rule.max, schema, value, context));
    const validate = () => {
        switch (schema.type) {
            case types_1.SchemaType.NUMBER:
                return assertType(schema.type, value) <= (0, resolve_1.assertNumber)(max);
            case types_1.SchemaType.STRING:
                return assertType(schema.type, value).length <= (0, resolve_1.assertNumber)(max);
            case types_1.SchemaType.OBJECT:
                return (Object.keys(assertType(schema.type, value)).length <=
                    (0, resolve_1.assertNumber)(max));
            case types_1.SchemaType.ARRAY:
                return assertType(schema.type, value).length <= (0, resolve_1.assertNumber)(max);
            case types_1.SchemaType.DATE_STRING: {
                const date = parseDateString(assertType(schema.type, value));
                const compareTo = parseDateString(assertType(types_1.SchemaType.DATE_STRING, max));
                return ((0, date_fns_1.isBefore)(date, compareTo) || date.getTime() === compareTo.getTime());
            }
        }
    };
    return validate()
        ? undefined
        : {
            code: types_1.ErrorCode.MAX,
            max,
        };
}
/**
 * Max precision rule validator
 *
 * @param rule the rule that is executed
 * @param value the value to be validated
 * @returns undefined then the validations passses, an error message when it fails
 */
function validateMaxPrecision(schema, rule, value, context) {
    const maxPrecision = (0, resolve_1.assertNumber)((0, resolve_1.unpackRef)(rule.max, schema, value, context));
    return maxPrecision <= getPrecision((0, resolve_1.assertNumber)(value))
        ? undefined
        : {
            code: types_1.ErrorCode.MAX_PRECISION,
            maxPrecision,
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
    return regex.test((0, resolve_1.assertString)(value))
        ? undefined
        : {
            code: types_1.ErrorCode.REGEX,
            regex: rule.regex,
        };
}
/**
 * Validates whether the value is of the correct type
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 * @returns true if the type is correct, false if not
 */
function validateType(type, value) {
    switch (type) {
        case types_1.SchemaType.NUMBER:
            return isNumber(value);
        case types_1.SchemaType.OBJECT:
            return isObject(value);
        case types_1.SchemaType.STRING:
            return isString(value);
        case types_1.SchemaType.ARRAY:
            return isArray(value);
        case types_1.SchemaType.DATE_STRING:
            return isDateString(value);
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
function assertType(type, value) {
    for (const t of Array.isArray(type) ? type : [type]) {
        if (validateType(t, value)) {
            return value;
        }
    }
    throw new Error(`Invalid value: ${value} for schema type: ${types_1.SchemaType}`);
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
    return typeof value === 'number';
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
/**
 * Validates whether a value is a string date
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
function isDateString(value) {
    const date = typeof value === 'string'
        ? (0, date_fns_1.parse)(value, 'yyyy-MM-dd', new Date())
        : undefined;
    return date instanceof Date && !isNaN(date.getTime());
}
function parseDateString(value) {
    return (0, date_fns_1.parse)(value, 'yyyy-MM-dd', new Date());
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
// /**
//  *
//  * Returns the size of a given schema value; used for example in the min/max rules
//  *
//  * @param type Schema type to determine the size for
//  * @param value value that is being evaluated
//  *
//  * @returns calculated size
//  */
// function getSizeOrThrow(type: SchemaType, value: unknown): number {
//   switch (type) {
//     case SchemaType.NUMBER:
//       return assertType(type, value);
//     case SchemaType.STRING:
//       return assertType(type, value).length;
//     case SchemaType.OBJECT:
//       return Object.keys(assertType(type, value)).length;
//     case SchemaType.ARRAY:
//       return assertType(type, value).length;
//     case SchemaType.STRING_DATE:
//       throw new Error('foo')
//   }
// }
function valueChanged(schema, currentValue, newValue) {
    if (schema.private) {
        if (!isPivateValue(currentValue) || !isPivateValue(newValue)) {
            throw new Error(`Expected private values for schema ${schema.path}, but got: currentValue=${currentValue}, newValue=${newValue}`);
        }
        return (currentValue.state === 'plain' &&
            newValue.state === 'plain' &&
            JSON.stringify(currentValue.value) !== JSON.stringify(newValue.value));
    }
    return JSON.stringify(currentValue) !== JSON.stringify(newValue);
}
function getValue(schema, value) {
    if (schema.private) {
        if (!isPivateValue(value)) {
            throw new Error(`Expected a private value for schema ${schema.path}, but got: ${value}`);
        }
        return value.value;
    }
    return value;
}
// function getValue(schema: ResolvedSchema, currentValue: unknown, newValue: unknown): { isChanged: boolean, isMasked: boolean, currentValue: unknown, newValue: unknown } {
//   const values = {
//     current: currentValue === undefined ? schema.default : currentValue,
//     new: newValue === undefined ? schema.default : newValue
//   }
//   if (schema.private) {
//     const data = getPrivateData(newValue)
//     const newValue = data.state === 'masked' ? data.value : values.new;
//     return {
//       isChanged: data.state === 'plain' && JSON.stringify(currentValue) !== JSON.stringify(newValue),
//       isMasked: data.state === 'masked',
//       currentValue: values.current,
//       newValue: data.state === 'masked' ? values.current : data.value === undefined ? schema.default : data.value
//     }
//   }
//   return {
//     isChanged: JSON.stringify(currentValue) !== JSON.stringify(newValue),
//     isMasked: false,
//     currentValue: values.current,
//     newValue: newValue === undefined ? schema.default : newValue
//   }
// }
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
            value: (0, resolve_1.assertString)(value.value),
        };
    }
    return {
        state: value.state,
        value: value.value,
    };
}
