import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const multiplyTransformerType = "multiply";

export type MultiplyTranformer<TValue extends ParamaterValue[] = never> = {
  type: typeof multiplyTransformerType;
  value: [TValue] extends [never] ? ParamaterValue[] : TValue;
};

/**
 * Creates a multiplication transformer (left * right).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param left - The first factor
 * @param right - The second factor
 * @returns A Transformer that computes left * right
 *
 * @example
 * // Total must equal quantity * unitPrice
 * number({
 *   rules: [equals(multiply(ref('quantity'), ref('unitPrice')))]
 * })
 *
 * @example
 * // Apply percentage (e.g., 10% tax)
 * multiply(ref('subtotal'), v(0.1))
 *
 * @see {@link divide} - Division transformer
 * @see {@link sum} - Addition transformer
 * @see {@link sub} - Subtraction transformer
 */
export function multiply<const T extends ParamaterValue[]>(value: T): MultiplyTranformer<T> {
  return {
    type: multiplyTransformerType,
    value,
  };
}

export function multiplyTransformer(value: Array<ValueType | undefined>) {
  if (!value?.length) return 0;
  return value.reduce<number>((acc, cur) => acc * coerceNumber(cur), 1);
}
