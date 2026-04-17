import { type ToParams, toParamaterValues } from "../../schemas";
import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const maxFunctionType = "max";

export type MaxFunction<TValue extends ParamaterValue[] = never> = {
  type: typeof maxFunctionType;
  value: [TValue] extends [never] ? ParamaterValue[] : TValue;
};

/**
 * Creates a maximum transformer that returns the largest value.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param values - The values to compare
 * @returns A Transformer that computes the maximum of all values
 *
 * @example
 * // Price must be at least the higher of: base price or cost + margin
 * number().min(d.max(d.ref('basePrice'), d.sum(d.ref('cost'), d.ref('margin'))))
 *
 * @example
 * // Take the larger of two values
 * d.max(d.ref('minOrder'), 10)
 *
 * @see {@link min} - Minimum transformer
 * @see {@link sum} - Addition transformer
 * @see {@link sub} - Subtraction transformer
 */
export function max<const T extends (ParamaterValue<number> | number)[]>(...value: T): MaxFunction<ToParams<T>> {
  return {
    type: maxFunctionType,
    value: toParamaterValues(value),
  };
}

export function maxFunction(value: Array<ValueType | undefined>): number {
  const numbers = value.map((v) => coerceNumber(v)).filter((v) => !Number.isNaN(v));
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
}
