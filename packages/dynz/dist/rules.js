"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = rules;
exports.ref = ref;
exports.min = min;
exports.max = max;
exports.regex = regex;
exports.equals = equals;
exports.isNumeric = isNumeric;
exports.custom = custom;
exports.conditional = conditional;
const types_1 = require("./types");
function rules(...rules) {
    return rules;
}
function ref(path) {
    return {
        type: '__reference',
        path,
    };
}
function min(min) {
    return { type: types_1.RuleType.MIN, min };
}
function max(max) {
    return { type: types_1.RuleType.MAX, max };
}
function regex(regex) {
    return { type: types_1.RuleType.REGEX, regex };
}
function equals(value) {
    return { type: types_1.RuleType.EQUALS, value };
}
function isNumeric() {
    return { type: types_1.RuleType.IS_NUMERIC };
}
function custom(name, params) {
    return { type: types_1.RuleType.CUSTOM, name, params: params || {} };
}
function conditional({ when, then, }) {
    return { type: types_1.RuleType.CONDITIONAL, when, then };
}
