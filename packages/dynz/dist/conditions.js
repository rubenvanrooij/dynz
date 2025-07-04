"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.and = and;
exports.or = or;
exports.eq = eq;
exports.neq = neq;
exports.gt = gt;
exports.gte = gte;
exports.lt = lt;
exports.lte = lte;
exports.matches = matches;
exports.isIn = isIn;
exports.isNotIn = isNotIn;
const types_1 = require("./types");
function and(...conditions) {
    return {
        type: types_1.ConditionType.AND,
        conditions,
    };
}
function or(...conditions) {
    return {
        type: types_1.ConditionType.OR,
        conditions,
    };
}
function eq(path, value) {
    return {
        type: types_1.ConditionType.EQUALS,
        path,
        value,
    };
}
function neq(path, value) {
    return {
        type: types_1.ConditionType.NOT_EQUALS,
        path,
        value,
    };
}
function gt(path, value) {
    return {
        type: types_1.ConditionType.GREATHER_THAN,
        path,
        value,
    };
}
function gte(path, value) {
    return {
        type: types_1.ConditionType.GREATHER_THAN_OR_EQUAL,
        path,
        value,
    };
}
function lt(path, value) {
    return {
        type: types_1.ConditionType.LOWER_THAN,
        path,
        value,
    };
}
function lte(path, value) {
    return {
        type: types_1.ConditionType.LOWER_THAN_OR_EQUAL,
        path,
        value,
    };
}
function matches(path, value) {
    return {
        type: types_1.ConditionType.MATCHES,
        path,
        value,
    };
}
function isIn(path, value) {
    return {
        type: types_1.ConditionType.IS_IN,
        path,
        value,
    };
}
function isNotIn(path, value) {
    return {
        type: types_1.ConditionType.IS_NOT_IN,
        path,
        value,
    };
}
