import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const notEqualsPredicateType = "neq";

export type NotEqualsPredicate<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof notEqualsPredicateType;
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
export function neq<const TLeft extends ParamaterValue, const TRight extends ParamaterValue>(
  left: TLeft,
  right: TRight
): NotEqualsPredicate<TLeft, TRight> {
  return {
    type: notEqualsPredicateType,
    left,
    right,
  };
}

export function notEqualsPredicate(left: ValueType | undefined, right: ValueType | undefined): boolean {
  return left !== right;
}
