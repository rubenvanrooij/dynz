import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const subTransformerType = "sub";

export type SubTranformer<TValue extends ParamaterValue[] = never> = {
  type: typeof subTransformerType;
  value: [TValue] extends [never] ? ParamaterValue[] : TValue;
};

/**
 * Creates a subtraction transformer (left - right).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param left - The value to subtract from (minuend)
 * @param right - The value to subtract (subtrahend)
 * @returns A Transformer that computes left - right
 *
 * @example
 * // Validate that profit (price - cost) is at least 10
 * number({
 *   rules: [min(sub(ref('price'), ref('cost')))]
 * })
 *
 * @example
 * // Use in a predicate
 * gt(sub(ref('total'), ref('discount')), v(0))
 *
 * @see {@link sum} - Addition transformer
 * @see {@link multiply} - Multiplication transformer
 * @see {@link divide} - Division transformer
 */
export function sub<const T extends ParamaterValue[]>(value: T): SubTranformer<T> {
  return {
    type: subTransformerType,
    value,
  };
}

export function subTransformer(value: Array<ValueType | undefined>) {
  if (!value?.length) return 0;
  const [first, ...rest] = value;
  return rest.reduce<number>((acc, cur) => acc - coerceNumber(cur), coerceNumber(first));
}
