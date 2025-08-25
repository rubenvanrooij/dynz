import { Schema, SchemaType, SchemaValues, ValidationResult, DateString, ValueType, Context } from './types';
export declare function validate<T extends Schema>(schema: T, currentValues: SchemaValues<T> | undefined, newValues: unknown): ValidationResult<SchemaValues<T>>;
export declare function _validate<T extends Schema>(schema: T, values: {
    current: unknown;
    new: unknown;
}, path: string, context: Context, parentValue?: unknown): ValidationResult<unknown>;
/**
 * Makes sure that a value is of a certain type; if not it throws an error
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 */
export declare function assertType<T extends SchemaType>(type: T | T[], value: unknown): ValueType<T>;
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
export declare function assertNumber(value: unknown): number;
export declare function assertObject(value: unknown): Record<string | number, unknown>;
export declare function assertArray(value: unknown): unknown[];
export declare function assertString(value: unknown): string;
export declare function assertDateString(value: unknown): string;
/**
 * Validates whether a value is a string date
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export declare function isDateString(value: unknown): value is DateString;
export declare function parseDateString(value: DateString): Date;
export declare function isValueMasked(schema: Schema, value: unknown): boolean;
//# sourceMappingURL=validate.d.ts.map