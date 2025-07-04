"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = exports.number = exports.DEFAULT_DATE_STRING_FORMAT = exports.object = void 0;
exports.string = string;
exports.dateString = dateString;
exports.optional = optional;
exports.required = required;
exports.rules = rules;
const types_1 = require("./types");
function buildBuilder(type) {
    return (value) => {
        return {
            ...(value || {}),
            type,
        };
    };
}
function string(value) {
    return {
        ...(value || {}),
        type: types_1.SchemaType.STRING,
    };
}
const object = (value) => {
    return {
        ...value,
        type: types_1.SchemaType.OBJECT,
    };
};
exports.object = object;
exports.DEFAULT_DATE_STRING_FORMAT = 'yyyy-MM-dd';
function dateString(value) {
    return {
        ...value,
        format: (value && value.format) || exports.DEFAULT_DATE_STRING_FORMAT,
        type: types_1.SchemaType.DATE_STRING,
    };
}
exports.number = buildBuilder(types_1.SchemaType.NUMBER);
const array = (value) => {
    return {
        ...value,
        type: types_1.SchemaType.ARRAY,
    };
};
exports.array = array;
function optional(schema) {
    return {
        ...schema,
        required: false,
    };
}
function required(schema) {
    return {
        ...schema,
        required: true,
    };
}
function rules(schema, ...rules) {
    return {
        ...schema,
        rules: rules,
    };
}
