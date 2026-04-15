import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const notEqualsFunctionType = "neq";

export type NotEqualsFunction<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof notEqualsFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

/**
 * Creates a "not equals" predicate (left !== right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left !== right
 *
 * @example
 * // Check if status is not 'deleted'
 * neq(ref('status'), v('deleted'))
 *
 * @example
 * // Ensure two fields are different
 * neq(ref('newPassword'), ref('oldPassword'))
 *
 * @see {@link eq} - Equals predicate
 */
export function neq<
  const TLeft extends ParamaterValue | number | string | boolean | Date,
  const TRight extends ParamaterValue | number | string | boolean | Date,
>(left: TLeft, right: TRight): NotEqualsFunction<ToParam<TLeft>, ToParam<TRight>> {
  return {
    type: notEqualsFunctionType,
    left: toParamaterValue(left),
    right: toParamaterValue(right),
  };
}

export function notEqualsFunction(left: ValueType | undefined, right: ValueType | undefined): boolean {
  return left !== right;
}
