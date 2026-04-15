import { type ToParams, toParamaterValues } from "../../schemas";
import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const sumFunctionType = "sum";

export type SumFunction<TValue extends ParamaterValue[] = never> = {
  type: typeof sumFunctionType;
  value: [TValue] extends [never] ? ParamaterValue[] : TValue;
};

/**
 * Creates an addition transformer (left + right).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param left - The first value to add
 * @param right - The second value to add
 * @returns A Transformer that computes left + right
 *
 * @example
 * // Price must be at least margin + commission
 * number({
 *   rules: [min(sum(ref('margin'), ref('commission')))]
 * })
 *
 * @example
 * // Nested transformers
 * sum(sum(ref('a'), ref('b')), ref('c'))  // a + b + c
 *
 * @see {@link sub} - Subtraction transformer
 * @see {@link multiply} - Multiplication transformer
 * @see {@link divide} - Division transformer
 */
export function sum<const T extends (ParamaterValue<number> | number)[]>(...value: T): SumFunction<ToParams<T>> {
  return {
    type: sumFunctionType,
    value: toParamaterValues(value),
  };
}

export function sumFunction(value: Array<ValueType | undefined>): number {
  return value?.reduce<number>((acc, cur) => acc + coerceNumber(cur), 0);
}
