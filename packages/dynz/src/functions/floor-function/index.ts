import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const floorFunctionType = "floor";

export type FloorFunction<TValue extends ParamaterValue = never> = {
  type: typeof floorFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates a floor transformer that rounds a value down to the nearest integer.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The floor transformer applies the mathematical floor function, always
 * rounding toward negative infinity.
 *
 * @category Transformer
 * @param value - The numeric value to round down (reference, static value, or another transformer)
 * @returns A Transformer that computes floor(value)
 *
 * @example
 * // Round down a calculated quantity
 * floor(divide(ref('budget'), ref('unitPrice')))
 *
 * @example
 * // Calculate complete groups
 * floor(divide(ref('items'), v(12)))
 *
 * @example
 * // Use in validation for whole number check
 * eq(ref('value'), floor(ref('value')))
 *
 * @see {@link ceil} - Ceiling transformer (rounds up)
 */
export function floor<const T extends ParamaterValue>(value: T): FloorFunction<T> {
  return {
    type: floorFunctionType,
    value,
  };
}

export function floorFunction(value: ValueType | undefined): number {
  return Math.floor(coerceNumber(value));
}
