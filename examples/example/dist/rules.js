"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = rules;
exports.val = val;
exports.ref = ref;
exports.min = min;
exports.max = max;
exports.regex = regex;
exports.equals = equals;
exports.conditional = conditional;
const types_1 = require("./types");
function rules(...rules) {
    return rules;
}
function val(value) {
    return {
        type: 'static',
        value,
    };
}
function ref(path) {
    return {
        type: 'reference',
        path,
    };
}
function min(min) {
    if (typeof min === 'string' || typeof min === 'number') {
        return { type: types_1.RuleType.MIN, min: val(min) };
    }
    return { type: types_1.RuleType.MIN, min };
}
function max(max) {
    if (typeof max === 'string' || typeof max === 'number') {
        return { type: types_1.RuleType.MAX, max: val(max) };
    }
    return { type: types_1.RuleType.MAX, max };
}
function regex(regex) {
    return { type: types_1.RuleType.REGEX, regex };
}
function equals(value) {
    return { type: types_1.RuleType.EQUALS, value };
}
function conditional({ when, then, }) {
    return { type: types_1.RuleType.CONDITIONAL, when, then };
}
