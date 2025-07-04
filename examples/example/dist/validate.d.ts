import { Context, ResolvedSchema, Schema, SchemaValues, ValidationResult, DateString } from './types';
export declare function validate<T extends Schema>(schema: ResolvedSchema<T>, currentValues: SchemaValues<T> | undefined, newValues: unknown): ValidationResult<SchemaValues<T>>;
export declare function _validate<T extends Schema>(schema: ResolvedSchema<T>, values: {
    current: unknown;
    new: unknown;
}, path: string, context: Context): ValidationResult<unknown>;
/**
 * Validates whether a value is a string value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export declare function isString(value: unknown): value is string;
/**
 * Validates whether a value is a number value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export declare function isNumber(value: unknown): value is number;
/**
 * Validates whether a value is a boolean value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export declare function isBoolean(value: unknown): value is boolean;
/**
 * Validates whether a value is an object (Record<string | number, unknown>) value. If
 * the value is e.g. an array type it will return false
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export declare function isObject(value: unknown): value is Record<string | number, unknown>;
/**
 * Validates whether a value is an array value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export declare function isArray(value: unknown): value is unknown[];
/**
 * Validates whether a value is a string date
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export declare function isDateString(value: unknown): value is DateString;
export declare function parseDateString(value: DateString): Date;
export declare function isValueMasked(schema: ResolvedSchema | Schema, value: unknown): boolean;
//# sourceMappingURL=validate.d.ts.map