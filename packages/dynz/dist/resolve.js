"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRequired = isRequired;
exports.isIncluded = isIncluded;
exports.isMutable = isMutable;
exports.resolveProperty = resolveProperty;
exports.resolveCondition = resolveCondition;
exports.resolveRules = resolveRules;
exports.isReference = isReference;
exports.unpackRefValue = unpackRefValue;
exports.unpackRef = unpackRef;
exports.findSchemaByPath = findSchemaByPath;
exports.getNested = getNested;
exports.cast = cast;
const types_1 = require("./types");
const validate_1 = require("./validate");
function isRequired(schema, path, values, strict = true) {
    const nested = getNested(path, schema, values, strict);
    return resolveProperty(nested.schema, 'required', path, true, {
        schema,
        strict,
        values: {
            new: values,
        },
    });
}
function isIncluded(schema, path, values, strict = true) {
    const nested = getNested(path, schema, values, strict);
    return resolveProperty(nested.schema, 'included', path, true, {
        schema,
        strict,
        values: {
            new: values,
        },
    });
}
function isMutable(schema, path, values, strict = true) {
    const nested = getNested(path, schema, values, strict);
    return resolveProperty(nested.schema, 'mutable', path, true, {
        schema,
        strict,
        values: {
            new: values,
        },
    });
}
/**
 * Resolves one of the following properties: required, mutable, included on a
 * schema
 */
function resolveProperty(schema, property, path, defaultValue, context) {
    if (schema[property] === undefined) {
        return defaultValue;
    }
    return typeof schema[property] === 'boolean'
        ? schema[property]
        : resolveCondition(schema[property], path, context);
}
function resolveCondition(condition, path, context) {
    switch (condition.type) {
        case types_1.ConditionType.AND:
            return condition.conditions.every((condition) => resolveCondition(condition, path, context));
        case types_1.ConditionType.OR:
            return condition.conditions.some((condition) => resolveCondition(condition, path, context));
        case types_1.ConditionType.EQUALS:
        case types_1.ConditionType.NOT_EQUALS:
        case types_1.ConditionType.GREATHER_THAN:
        case types_1.ConditionType.GREATHER_THAN_OR_EQUAL:
        case types_1.ConditionType.LOWER_THAN:
        case types_1.ConditionType.LOWER_THAN_OR_EQUAL:
            return validateWithOperator(condition, path, context);
        case types_1.ConditionType.MATCHES: {
            const left = getNestedValue(ensureAbsolutePath(condition.path, path), context.schema, context.values.new, context.strict);
            if (!(0, validate_1.isString)(left)) {
                throw new Error(`Condition ${condition.type} expects a string value at path ${condition.path}, but got ${typeof left}`);
            }
            return new RegExp(condition.value).test(left);
        }
        case types_1.ConditionType.IS_IN: {
            const { left, right } = getConditionOperands(condition, path, context);
            return (0, validate_1.assertArray)(right).includes(left);
        }
        case types_1.ConditionType.IS_NOT_IN: {
            const { left, right } = getConditionOperands(condition, path, context);
            return !(0, validate_1.assertArray)(right).includes(left);
        }
    }
}
const OPERATORS = {
    [types_1.ConditionType.EQUALS]: (a, b) => {
        return a === b;
    },
    [types_1.ConditionType.NOT_EQUALS]: (a, b) => a === b,
    [types_1.ConditionType.GREATHER_THAN]: (a, b) => a > b,
    [types_1.ConditionType.GREATHER_THAN_OR_EQUAL]: (a, b) => a >= b,
    [types_1.ConditionType.LOWER_THAN]: (a, b) => a < b,
    [types_1.ConditionType.LOWER_THAN_OR_EQUAL]: (a, b) => a <= b,
};
function validateWithOperator(condition, path, context) {
    const { left, right } = getConditionOperands(condition, path, context);
    // Both operands must be defined for comparison
    if (left === undefined || right === undefined) {
        return false;
    }
    return OPERATORS[condition.type](left, right);
}
/**
 * Converts a value to a comparable type based on the schema.
 * For date strings, converts to milliseconds for proper comparison.
│* For other types, returns the value unchanged.
 */
function toCompareType(schema, value) {
    if (schema.type === types_1.SchemaType.DATE_STRING) {
        return (0, validate_1.parseDateString)(`${value}`, schema.format).getTime();
    }
    return value;
}
/**
 * Returns the condition operands for a specific condition and validates whether the type of the value is correct
 * for a referenced value it is using the referenced schema type; for a static value it is using the schema type of
 * the validated schema itself. When the value does not comply with the schema type, it returns undefined.
 *
 * @param condition
 * @param path
 * @param context
 * @returns
 */
function getConditionOperands(condition, path, context) {
    const nested = getNested(ensureAbsolutePath(condition.path, path), context.schema, context.values.new, context.strict);
    const left = (0, validate_1.validateSchema)(nested.schema, nested.value)
        ? toCompareType(nested.schema, nested.value)
        : undefined;
    if (Array.isArray(condition.value)) {
        return {
            left,
            right: condition.value.map((val) => {
                // TODO: Fix this!
                const unpacked = unpackRef(val, path, context);
                if (unpacked.static) {
                    // TODO: Add dev check to ensure value is of type ValueType
                    return (0, validate_1.validateSchema)(nested.schema, unpacked.value)
                        ? toCompareType(nested.schema, unpacked.value)
                        : undefined;
                }
                return (0, validate_1.validateSchema)(unpacked.schema, unpacked.value)
                    ? toCompareType(unpacked.schema, unpacked.value)
                    : undefined;
            }),
        };
    }
    const unpacked = unpackRef(condition.value, path, context);
    if (unpacked.static) {
        return {
            left: left,
            // TODO: Add dev check to ensure value is of type ValueType
            right: (0, validate_1.validateSchema)(nested.schema, unpacked.value)
                ? toCompareType(nested.schema, unpacked.value)
                : undefined,
        };
    }
    return {
        left: left,
        right: (0, validate_1.validateSchema)(unpacked.schema, unpacked.value)
            ? toCompareType(unpacked.schema, unpacked.value)
            : undefined,
    };
}
function resolveRules(schema, path, context) {
    return (schema.rules || [])
        .filter((rule) => rule.type === types_1.RuleType.CONDITIONAL
        ? resolveCondition(rule.when, path, context)
        : true)
        .map((rule) => rule.type === types_1.RuleType.CONDITIONAL ? rule.then : rule);
}
function isReference(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        value.type === '__reference');
}
function unpackRefValue(valueOrRef, path, context) {
    return unpackRef(valueOrRef, path, context).value;
}
function unpackRef(valueOrRef, path, context) {
    if (isReference(valueOrRef)) {
        const { schema, value } = getNested(ensureAbsolutePath(valueOrRef.path, path), context.schema, context.values.new, context.strict);
        return {
            schema,
            value: context.strict ? value : cast(schema, value),
            static: false,
        };
    }
    return { value: valueOrRef, static: true };
}
function ensureAbsolutePath(fieldPath, path) {
    if (fieldPath.startsWith('$')) {
        return fieldPath;
    }
    return `${getParent(path)}.${fieldPath}`;
}
function getParent(path) {
    return path.split('.').slice(0, -1).join('.');
}
function findSchemaByPath(path, schema, type) {
    const nestedSchema = path
        .split(/[.[\]]/)
        .filter(Boolean)
        .splice(1)
        .reduce((prev, cur) => {
        if (prev.type === types_1.SchemaType.ARRAY) {
            if (!(0, validate_1.isNumber)(+cur)) {
                throw new Error(`Expected an array index at path ${path}, but got ${cur}`);
            }
            return prev.schema;
        }
        if (prev.type === types_1.SchemaType.OBJECT) {
            const childSchema = prev.fields[cur];
            if (childSchema === undefined) {
                throw new Error(`No schema found for path ${path}`);
            }
            return childSchema;
        }
        throw new Error(`Cannot find schema at path ${path}`);
    }, schema);
    if (type !== undefined && nestedSchema.type !== type) {
        throw new Error(`Expected schema of type ${type} at path ${path}, but got ${nestedSchema.type}`);
    }
    return nestedSchema;
}
function getNested(path, schema, value, strict) {
    if (schema.private) {
        throw new Error(`Cannot access private schema at path ${path}`);
    }
    const result = path
        .split(/[.[\]]/)
        .filter(Boolean)
        .splice(1)
        .reduce((acc, cur) => {
        if (acc.schema.type === types_1.SchemaType.ARRAY) {
            if (!Array.isArray(acc.value)) {
                throw new Error(`Expected an array at path ${path}, but got ${typeof acc.value}`);
            }
            const childSchema = acc.schema.schema;
            const index = +cur;
            const val = acc.value[index];
            if (childSchema.private === true) {
                throw new Error(`Cannot access private schema at path ${path}`);
            }
            return {
                value: val === undefined ? acc.schema.default : val,
                schema: acc.schema.schema,
            };
        }
        if (acc.schema.type === types_1.SchemaType.OBJECT) {
            if (acc.value !== undefined && !(0, validate_1.isObject)(acc.value)) {
                throw new Error(`Expected an object at path ${path}, but got ${typeof acc.value}`);
            }
            const val = acc.value === undefined ? undefined : acc.value[cur];
            const childSchema = acc.schema.fields[cur];
            if (childSchema === undefined) {
                throw new Error(`No schema found for path ${path}`);
            }
            if (childSchema.private === true) {
                throw new Error(`Cannot access private schema at path ${path}`);
            }
            return {
                value: val === undefined ? acc.schema.fields[cur]?.default : val,
                schema: childSchema,
            };
        }
        throw new Error('Cannot get nested value on non array or non object');
    }, { value, schema });
    return {
        schema: result.schema,
        value: strict ? result.value : cast(result.schema, result.value)
    };
}
function getNestedValue(path, schema, value, strict) {
    return getNested(path, schema, value, strict).value;
}
/**
 * Function that tries to cast a value to the correct chema type:
 * e.g.:
 * "12" -> 12
 * or
 * true -> "true", 12 -> "12"
 */
function cast(schema, value) {
    if (value === undefined || value === null) {
        return value;
    }
    switch (schema.type) {
        case types_1.SchemaType.NUMBER: {
            if ((0, validate_1.isString)(value)) {
                const parsed = Number(value);
                if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
                    return parsed;
                }
            }
            return value;
        }
        case types_1.SchemaType.BOOLEAN:
            if (value === 'true') {
                return true;
            }
            if (value === 'false') {
                return false;
            }
            return value;
        case types_1.SchemaType.STRING: {
            if ((0, validate_1.isNumber)(value) || (0, validate_1.isBoolean)(value)) {
                return String(value);
            }
            return value;
        }
        case types_1.SchemaType.ARRAY: {
            // TODO: Find out of there is any security risk in converting a file list to an array?
            if (value instanceof FileList) {
                return Array.from(value);
            }
            return value;
        }
        default:
            return value;
    }
}
