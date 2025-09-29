import { parse } from "date-fns";
import type { Enum, OptionValue } from "../schemas";
import { type DateString, type Schema, SchemaType, type ValueType } from "../types";

/**
 * Validates whether the value is of the correct type for a given schema
 *
 * @param schema the expected schema
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function validateType<T extends Schema>(schema: T, value: unknown): value is ValueType<T["type"]> {
  switch (schema.type) {
    case SchemaType.NUMBER:
      return isNumber(value);
    case SchemaType.OBJECT:
      return isObject(value);
    case SchemaType.STRING:
      return isString(value);
    case SchemaType.BOOLEAN:
      return isBoolean(value);
    case SchemaType.DATE:
      return isDate(value);
    case SchemaType.ARRAY:
      return isArray(value);
    case SchemaType.FILE:
      return isFile(value);
    case SchemaType.ENUM:
      return isEnum(schema.enum, value);
    case SchemaType.DATE_STRING:
      return isDateString(value, schema.format);
    case SchemaType.OPTIONS:
      return isOption(schema.options, value);
  }
}

/**
 * Shallow validation whether the value is of the correct type
 *
 * It only checks the primitive type and does not validate e.g. if an enum value is actually part of the enum
 *
 * @param type the expected type of the value
 * @param value the value to be validated
 * @returns true if the type is correct, false if not
 */
export function validateShallowType<T extends SchemaType>(type: T, value: unknown): value is ValueType<T> {
  switch (type) {
    case SchemaType.NUMBER:
      return isNumber(value);
    case SchemaType.OBJECT:
      return isObject(value);
    case SchemaType.STRING:
      return isString(value);
    case SchemaType.BOOLEAN:
      return isBoolean(value);
    case SchemaType.DATE:
      return isDate(value);
    case SchemaType.ARRAY:
      return isArray(value);
    case SchemaType.FILE:
      return isFile(value);
    case SchemaType.ENUM:
      return isString(value) || isNumber(value);
    case SchemaType.DATE_STRING:
      return isString(value);
    case SchemaType.OPTIONS:
      return isNumber(value) || isString(value) || isBoolean(value);
  }
}

/**
 * Validates whether a value is an enum value
 *
 * @param enum_ the enum to be expected
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isEnum<const T extends Enum>(enum_: T, value: unknown): value is T {
  return Object.values(enum_).some((v) => v === value);
}

/**
 * Validates whether a value is an option value
 *
 * @param options list of possible options
 * @param value the value to be validated
 * @returns true if the value is an option, false if not
 */
export function isOption<const T extends OptionValue>(options: readonly T[], value: unknown): value is T {
  return options.some((v) => v === value);
}

/**
 * Validates whether a value is a string value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Validates whether a value is a number value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);
}

/**
 * Validates whether a value is a date value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime()) && value.toString() !== "Invalid Date";
}

/**
 * Validates whether a value is a boolean value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Validates whether a value is a iterable value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
  return value != null && typeof value === "object" && Symbol.iterator in value;
}

/**
 * Validates whether a value is a file value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * Validates whether a value is an object (Record<string | number, unknown>) value. If
 * the value is e.g. an array type it will return false
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isObject(value: unknown): value is Record<string | number, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validates whether a value is an array value
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Validates whether a value is a string date
 *
 * @param value the value to be validated
 * @returns true if the value is correct, false if not
 */
export function isDateString(value: unknown, format: string): value is DateString {
  const date = typeof value === "string" ? parse(value, format, new Date()) : undefined;
  return date instanceof Date && !Number.isNaN(date.getTime());
}

export function parseDateString(value: DateString, format: string): Date {
  return parse(value, format, new Date());
}
