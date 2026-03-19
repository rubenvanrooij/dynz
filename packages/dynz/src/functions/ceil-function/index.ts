import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const ceilFunctionType = "ceil";

export type CeilFunction<TValue extends ParamaterValue = never> = {
  type: typeof ceilFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates a ceiling transformer that rounds a value up to the nearest integer.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The ceiling transformer applies the mathematical ceiling function, always
 * rounding toward positive infinity.
 *
 * @category Transformer
 * @param value - The numeric value to round up (reference, static value, or another transformer)
 * @returns A Transformer that computes ceil(value)
 *
 * @example
 * // Round up a calculated price
 * ceil(divide(ref('total'), ref('quantity')))
 *
 * @example
 * // Ensure minimum whole units
 * ceil(divide(ref('weight'), v(10)))
 *
 * @example
 * // Use in validation
 * eq(ref('allocatedSlots'), ceil(divide(ref('participants'), v(4))))
 *
 * @see {@link floor} - Floor transformer (rounds down)
 */
export function ceil<const T extends ParamaterValue>(value: T): CeilFunction<T> {
  return {
    type: ceilFunctionType,
    value,
  };
}

export function ceilFunction(value: ValueType | undefined): number {
  return Math.ceil(coerceNumber(value));
}
