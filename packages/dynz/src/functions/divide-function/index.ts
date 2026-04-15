import { type ToParams, toParamaterValues } from "../../schemas";
import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const divideFunctionType = "divide";

export type DivideFunction<TValue extends ParamaterValue[] = never> = {
  type: typeof divideFunctionType;
  value: [TValue] extends [never] ? ParamaterValue[] : TValue;
};

/**
 * Creates a division transformer (left / right).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param left - The dividend (number to be divided)
 * @param right - The divisor (number to divide by)
 * @returns A Transformer that computes left / right
 *
 * @example
 * // Check if average score is above 70
 * gt(divide(ref('totalScore'), ref('numTests')), v(70))
 *
 * @example
 * // Calculate unit price
 * divide(ref('totalPrice'), ref('quantity'))
 *
 * @see {@link multiply} - Multiplication transformer
 * @see {@link sum} - Addition transformer
 * @see {@link sub} - Subtraction transformer
 */
export function divide<const T extends (ParamaterValue<number> | number)[]>(...value: T): DivideFunction<ToParams<T>> {
  return {
    type: divideFunctionType,
    value: toParamaterValues(value),
  };
}

export function divideFunction(value: Array<ValueType | undefined>): number {
  if (!value?.length) return 0;
  const [first, ...rest] = value;
  return rest.reduce<number>((acc, cur) => acc / coerceNumber(cur), coerceNumber(first));
}
