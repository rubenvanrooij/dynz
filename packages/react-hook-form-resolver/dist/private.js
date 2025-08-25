"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plain = plain;
exports.mask = mask;
const DEFAULT_MASK_FUNCTION = () => {
    return '***';
};
function plain(value) {
    return {
        state: 'plain',
        value,
    };
}
function mask(value, maskFn = DEFAULT_MASK_FUNCTION) {
    return {
        state: 'masked',
        value: maskFn(value
            ? typeof value === 'string' || typeof value === 'number'
                ? value
                : value.value
            : undefined),
    };
}
