import { type Schema, SchemaType } from "../types";
import { isBoolean, isIterable, isNumber, isString } from "../validate/validate";

/**
 * Function that tries to cast a value to the correct chema type:
 * e.g.:
 * "12" -> 12
 * or
 * true -> "true", 12 -> "12"
 */
export function coerce<T extends Schema>(schema: T, value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  // Only 'coerce' when requestd
  if (!("coerce" in schema && schema.coerce === true)) {
    return value;
  }

  switch (schema.type) {
    case SchemaType.DATE: {
      if (isNumber(value) || isString(value)) {
        return new Date(value);
      }
      return value;
    }
    case SchemaType.NUMBER: {
      if (!isNumber(value)) {
        return Number(value).valueOf();
      }

      return value;
    }
    case SchemaType.BOOLEAN:
      if (isBoolean(value)) {
        return value;
      }

      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }

      return new Boolean(value).valueOf();
    case SchemaType.STRING: {
      if (isNumber(value) || isBoolean(value)) {
        return String(value).valueOf();
      }
      return value;
    }
    case SchemaType.ARRAY: {
      if (isIterable(value) || isString(value)) {
        return Array.from(value);
      }

      return value;
    }
    default:
      return value;
  }
}
