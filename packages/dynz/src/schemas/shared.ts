import { type ParamaterValue, type Static, val } from "../functions";
import { isBoolean, isDate, isNumber, isString } from "../validate/validate-type";

/**
 * Collapses a raw primitive (string, number, boolean, Date) into its
 * Static<T> equivalent, passing through any ParamaterValue unchanged.
 */
export type ToParam<T extends ParamaterValue | number | string | boolean | Date> = T extends ParamaterValue
  ? T
  : [T] extends [undefined]
    ? undefined
    : Static<T>;

/**
 * Maps an array of values to their ToParam equivalents.
 */
export type ToParams<T extends (ParamaterValue | number | string | boolean | Date)[]> = {
  [K in keyof T]: ToParam<T[K]>;
};

/**
 * Runtime counterpart of ToParam. Wraps string/number/boolean/Date literals
 * in val(); passes ParamaterValues through as-is.
 */
export function toParamaterValue<T extends ParamaterValue | number | string | boolean | Date>(value: T): ToParam<T> {
  if (isString(value) || isBoolean(value) || isNumber(value) || isDate(value)) {
    return val(value) as ToParam<T>;
  }
  return value as ToParam<T>;
}

/**
 * Runtime counterpart of ToParams. Maps an array of values to their wrapped equivalents.
 */
export function toParamaterValues<T extends (ParamaterValue | number | string | boolean | Date)[]>(
  values: T
): ToParams<T> {
  return values.map((v) => toParamaterValue(v)) as ToParams<T>;
}
