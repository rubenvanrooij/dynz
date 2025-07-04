"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRequired = isRequired;
exports.isIncluded = isIncluded;
exports.isMutable = isMutable;
exports.resolveRules = resolveRules;
exports.resolveValueOrCondition = resolveValueOrCondition;
exports.unpackRef = unpackRef;
const rules_1 = require("./rules");
const types_1 = require("./types");
const validate_1 = require("./validate");
function isRequired(schema, path, context) {
    return resolveValueOrCondition(schema.required || (0, rules_1.val)(false), path, context);
}
function isIncluded(schema, path, context) {
    return resolveValueOrCondition(schema.included || (0, rules_1.val)(true), path, context);
}
function isMutable(schema, path, context) {
    return resolveValueOrCondition(schema.mutable || (0, rules_1.val)(true), path, context);
}
function resolveCondition(condition, path, context) {
    switch (condition.type) {
        case types_1.ConditionType.AND:
            return condition.conditions.every((condition) => resolveCondition(condition, path, context));
        case types_1.ConditionType.OR:
            return condition.conditions.some((condition) => resolveCondition(condition, path, context));
        case types_1.ConditionType.EQUALS:
            return (unpackRef(condition.value, path, context) ===
                getNestedValue(ensureAbsolutePath(condition.path, path), context.schema, context.values.new));
        case types_1.ConditionType.NOT_EQUALS:
            return (unpackRef(condition.value, path, context) !==
                getNestedValue(ensureAbsolutePath(condition.path, path), context.schema, context.values.new));
        case types_1.ConditionType.GREATHER_THAN: {
            const { left, right } = getConditionOperands(condition, path, context);
            return (0, validate_1.assertNumber)(left) > (0, validate_1.assertNumber)(right);
        }
        case types_1.ConditionType.GREATHER_THAN_OR_EQUAL: {
            const { left, right } = getConditionOperands(condition, path, context);
            return (0, validate_1.assertNumber)(left) >= (0, validate_1.assertNumber)(right);
        }
        case types_1.ConditionType.LOWER_THAN: {
            const { left, right } = getConditionOperands(condition, path, context);
            return (0, validate_1.assertNumber)(left) < (0, validate_1.assertNumber)(right);
        }
        case types_1.ConditionType.LOWER_THAN_OR_EQUAL: {
            const { left, right } = getConditionOperands(condition, path, context);
            return (0, validate_1.assertNumber)(left) <= (0, validate_1.assertNumber)(right);
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
function getConditionOperands(condition, path, context) {
    return {
        left: getNestedValue(ensureAbsolutePath(condition.path, path), context.schema, context.values.new),
        right: Array.isArray(condition.value)
            ? condition.value.map((val) => unpackRef(val, path, context))
            : unpackRef(condition.value, path, context),
    };
}
function resolveRules(schema, path, context) {
    return (schema.rules || [])
        .filter((rule) => rule.type === types_1.RuleType.CONDITIONAL
        ? resolveCondition(rule.when, path, context)
        : true)
        .map((rule) => rule.type === types_1.RuleType.CONDITIONAL ? rule.then : rule);
}
function resolveValueOrCondition(valueOrCondition, path, context) {
    if (valueOrCondition.type === 'static') {
        return valueOrCondition.value;
    }
    return resolveCondition(valueOrCondition, path, context);
}
function unpackRef(valueOrRef, path, context) {
    if (valueOrRef.type === 'static') {
        return valueOrRef.value;
    }
    return getNestedValue(ensureAbsolutePath(valueOrRef.path, path), context.schema, context.values.new);
}
function ensureAbsolutePath(fieldPath, path) {
    if (fieldPath.startsWith('$')) {
        return fieldPath;
    }
    return `${getParent(path)}${fieldPath}`;
}
function getParent(path) {
    return path.split('.').slice(0, -1).join('.');
}
function getNestedValue(path, schema, value) {
    const result = path
        .split(/[.[\]]/)
        .filter(Boolean)
        .splice(1)
        .reduce((prev, cur) => {
        if (prev.schema === undefined) {
            throw new Error(`No schema found for path ${cur}`);
        }
        if (prev.value === undefined || prev.value === null) {
            return {
                value: undefined,
                schema: prev.schema,
            };
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
    }, { value, schema });
    return result.value;
}
