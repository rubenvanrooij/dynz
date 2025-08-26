"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = exports.DEFAULT_DATE_STRING_FORMAT = exports.object = void 0;
exports.string = string;
exports.number = number;
exports.boolean = boolean;
exports.file = file;
exports.options = options;
exports.dateString = dateString;
exports.optional = optional;
exports.required = required;
exports.rules = rules;
const types_1 = require("./types");
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
function number(value) {
    return {
        ...(value || {}),
        type: types_1.SchemaType.NUMBER,
    };
}
;
function boolean(value) {
    return {
        ...(value || {}),
        type: types_1.SchemaType.BOOLEAN,
    };
}
;
function file(value) {
    return {
        ...(value || {}),
        type: types_1.SchemaType.FILE,
    };
}
;
function options(value) {
    return {
        ...(value || {}),
        type: types_1.SchemaType.OPTIONS,
    };
}
;
function dateString(value) {
    return {
        ...value,
        format: (value && value.format) || exports.DEFAULT_DATE_STRING_FORMAT,
        type: types_1.SchemaType.DATE_STRING,
    };
}
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
