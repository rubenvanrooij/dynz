"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = exports.number = exports.object = exports.dateString = exports.string = void 0;
const types_1 = require("./types");
function buildBuilder(type) {
    return (value) => {
        return {
            ...value,
            type,
        };
    };
}
exports.string = buildBuilder(types_1.SchemaType.STRING);
exports.dateString = buildBuilder(types_1.SchemaType.DATE_STRING);
const object = (value) => {
    return {
        ...value,
        type: types_1.SchemaType.OBJECT,
    };
};
exports.object = object;
exports.number = buildBuilder(types_1.SchemaType.NUMBER);
const array = (value) => {
    return {
        ...value,
        type: types_1.SchemaType.ARRAY,
    };
};
exports.array = array;
