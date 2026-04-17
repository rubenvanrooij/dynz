import { type ToParams, toParamaterValues } from "../../schemas";
import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const minFunctionType = "min";

export type MinFunction<TValue extends ParamaterValue[] = never> = {
  type: typeof minFunctionType;
  value: [TValue] extends [never] ? ParamaterValue[] : TValue;
};

/**
 * Creates a minimum transformer that returns the smallest value.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param values - The values to compare
 * @returns A Transformer that computes the minimum of all values
 *
 * @example
 * // Discount can't exceed the smaller of: 20% or quantity-based discount
 * number().max(d.min(20, d.divide(d.ref('quantity'), 10)))
 *
 * @example
 * // Take the smaller of two limits
 * d.min(d.ref('userLimit'), d.ref('systemLimit'))
 *
 * @see {@link max} - Maximum transformer
 * @see {@link sum} - Addition transformer
 * @see {@link sub} - Subtraction transformer
 */
export function min<const T extends (ParamaterValue<number> | number)[]>(...value: T): MinFunction<ToParams<T>> {
  return {
    type: minFunctionType,
    value: toParamaterValues(value),
  };
}

export function minFunction(value: Array<ValueType | undefined>): number {
  const numbers = value.map((v) => coerceNumber(v)).filter((v) => !Number.isNaN(v));
  if (numbers.length === 0) return 0;
  return Math.min(...numbers);
}
