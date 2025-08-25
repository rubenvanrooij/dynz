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
function min(min, code) {
    return { type: types_1.RuleType.MIN, min, code };
}
function max(max, code) {
    return { type: types_1.RuleType.MAX, max, code };
}
function regex(regex, code) {
    return { type: types_1.RuleType.REGEX, regex, code };
}
function equals(value, code) {
    return { type: types_1.RuleType.EQUALS, value, code };
}
function isNumeric(code) {
    return { type: types_1.RuleType.IS_NUMERIC, code };
}
function custom(name, params) {
    return { type: types_1.RuleType.CUSTOM, name, params: params || {} };
}
function conditional({ when, then, }) {
    return { type: types_1.RuleType.CONDITIONAL, when, then };
}
