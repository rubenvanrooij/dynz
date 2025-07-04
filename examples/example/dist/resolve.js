"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = resolve;
exports.assertNumber = assertNumber;
exports.assertString = assertString;
exports.unpackRef = unpackRef;
const rules_1 = require("./rules");
const types_1 = require("./types");
const validate_1 = require("./validate");
function resolve(schema, values) {
    return _resolve(schema, values, '$', {
        type: 'resolve',
        schema,
        values,
    });
}
function _resolve(schema, value, path = '$', context) {
    const resolvedProperties = {
        rules: resolveRules(schema.rules || [], schema, value, context),
        required: resolveValueOrCondition(schema.required || (0, rules_1.val)(false), schema, value, context),
        included: resolveValueOrCondition(schema.included || (0, rules_1.val)(true), schema, value, context),
        mutable: resolveValueOrCondition(schema.mutable || (0, rules_1.val)(true), schema, value, context),
    };
    switch (schema.type) {
        case types_1.SchemaType.STRING:
        case types_1.SchemaType.NUMBER:
        case types_1.SchemaType.DATE_STRING:
        case types_1.SchemaType.OPTIONS:
            return {
                ...schema,
                ...resolvedProperties,
                private: schema.private || false,
                path,
            };
        case types_1.SchemaType.OBJECT:
            return {
                ...schema,
                ...resolvedProperties,
                fields: Object.entries(schema.fields).reduce((acc, [key, childSchema]) => ({
                    ...acc,
                    [key]: _resolve(childSchema, (0, validate_1.isObject)(value) ? value[key] : undefined, `${path}.${key}`, context),
                }), {}),
                path,
            };
        case types_1.SchemaType.ARRAY:
            return {
                ...schema,
                ...resolvedProperties,
                defaultSchema: _resolve(schema.schema, value, `${path}.[]`, context),
                schema: Array.isArray(value)
                    ? value.map((v, index) => _resolve(schema.schema, v, `${path}.[${index}]`, context))
                    : [],
                path,
            };
    }
}
function resolveCondition(condition, schema, value, context) {
    switch (condition.type) {
        case types_1.ConditionType.AND:
            return condition.conditions.every((condition) => resolveCondition(condition, schema, value, context));
        case types_1.ConditionType.OR:
            return condition.conditions.some((condition) => resolveCondition(condition, schema, value, context));
        case types_1.ConditionType.EQUALS:
            return (unpackRef(condition.value, schema, value, context) ===
                getNestedValue(condition.path, schema, value, context));
        case types_1.ConditionType.NOT_EQUALS:
            return (unpackRef(condition.value, schema, value, context) !==
                getNestedValue(condition.path, schema, value, context));
        case types_1.ConditionType.GREATHER_THAN: {
            const { left, right } = getConditionOperands(condition, schema, context);
            return assertNumber(left) > assertNumber(right);
        }
        case types_1.ConditionType.GREATHER_THAN_OR_EQUAL: {
            const { left, right } = getConditionOperands(condition, schema, context);
            return assertNumber(left) >= assertNumber(right);
        }
        case types_1.ConditionType.LOWER_THAN: {
            const { left, right } = getConditionOperands(condition, schema, context);
            return assertNumber(left) < assertNumber(right);
        }
        case types_1.ConditionType.LOWER_THAN_OR_EQUAL: {
            const { left, right } = getConditionOperands(condition, schema, context);
            return assertNumber(left) <= assertNumber(right);
        }
        case types_1.ConditionType.IS_IN: {
            const { left, right } = getConditionOperands(condition, schema, context);
            return assertArray(right).includes(left);
        }
        case types_1.ConditionType.IS_NOT_IN: {
            const { left, right } = getConditionOperands(condition, schema, context);
            return !assertArray(right).includes(left);
        }
    }
}
function getConditionOperands({ path, value }, schema, context) {
    return {
        left: getNestedValue(path, schema, context.values, context),
        right: Array.isArray(value)
            ? value.map((val) => unpackRef(val, schema, context.values, context))
            : unpackRef(value, schema, context.values, context),
    };
}
function assertNumber(value) {
    if (typeof value === 'number') {
        return value;
    }
    throw new Error(`Value is not of type number`);
}
function assertObject(value) {
    if ((0, validate_1.isObject)(value)) {
        return value;
    }
    throw new Error(`Value is not of type object`);
}
function assertArray(value) {
    if (Array.isArray(value)) {
        return value;
    }
    throw new Error(`Value is not of type array`);
}
function assertString(value) {
    if (typeof value === 'string') {
        return value;
    }
    throw new Error(`Value is not of type string`);
}
function resolveRules(rules, schema, value, context) {
    return rules
        .filter((rule) => rule.type === types_1.RuleType.CONDITIONAL
        ? resolveCondition(rule.when, schema, value, context)
        : true)
        .map((rule) => rule.type === types_1.RuleType.CONDITIONAL ? rule.then : rule);
}
function resolveValueOrCondition(valueOrCondition, schema, value, context) {
    if (valueOrCondition.type === 'static') {
        return valueOrCondition.value;
    }
    return resolveCondition(valueOrCondition, schema, value, context);
}
function unpackRef(valueOrRef, schema, value, context) {
    if (valueOrRef.type === 'static') {
        return valueOrRef.value;
    }
    return getNestedValue(valueOrRef.path, schema, value, context);
}
function getNestedValue(path, schema, value, context) {
    const isAbsolute = path.startsWith('$.');
    // retrieve current values from the context
    const values = context.type === 'resolve' ? context.values : context.values.current;
    const result = path
        .split(/[.[\]]/)
        .filter(Boolean)
        .splice(isAbsolute ? 1 : 0)
        .reduce((prev, cur) => {
        if (prev.value === undefined ||
            prev.value === null ||
            prev.schema === undefined) {
            throw new Error(`path ${cur} not found in values: ${JSON.stringify(isAbsolute ? values : value)}`);
        }
        if (Array.isArray(prev.value) &&
            prev.schema.type === types_1.SchemaType.ARRAY) {
            const index = +cur;
            const val = prev.value[index];
            return {
                value: val === undefined ? prev.schema.default : val,
                schema: Array.isArray(prev.schema.schema)
                    ? prev.schema.schema[index]
                    : prev.schema.schema,
            };
        }
        if ((0, validate_1.isObject)(prev.value) && prev.schema.type === types_1.SchemaType.OBJECT) {
            const val = prev.value[cur];
            return {
                value: val === undefined ? prev.schema.fields[cur]?.default : val,
                schema: prev.schema.fields[cur],
            };
        }
        throw new Error('cannot get nested value on non array or non object');
    }, isAbsolute
        ? { value: values, schema: context.schema }
        : { value, schema });
    return result.value;
}
