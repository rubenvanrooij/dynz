"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = exports.SchemaType = exports.ConditionType = exports.RuleType = void 0;
exports.RuleType = {
    MIN: 'min',
    MAX: 'max',
    MAX_PRECISION: 'max_precision',
    REGEX: 'regex',
    EQUALS: 'equals',
    CONDITIONAL: 'conditional',
};
/**
 *
 *
 * CONDITIONS
 *
 *
 */
// type Condition = {
//     path: string
//     operator:
// }
exports.ConditionType = {
    OR: 'or',
    AND: 'and',
    EQUALS: 'eq',
    NOT_EQUALS: 'neq',
    GREATHER_THAN: 'gt',
    GREATHER_THAN_OR_EQUAL: 'gte',
    LOWER_THAN: 'lt',
    LOWER_THAN_OR_EQUAL: 'lte',
    IS_IN: 'in',
    IS_NOT_IN: 'nin',
};
/**
 *
 *
 * SCHEMAS
 *
 *
 */
exports.SchemaType = {
    STRING: 'string',
    DATE_STRING: 'date_string',
    NUMBER: 'number',
    OBJECT: 'object',
    ARRAY: 'array',
    OPTIONS: 'options',
};
exports.ErrorCode = {
    ...exports.RuleType,
    IMMUTABLE: 'immutable',
    INCLUDED: 'included',
    REQRUIED: 'required',
    TYPE: 'type'
};
