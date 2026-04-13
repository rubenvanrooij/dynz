import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const equalsFunctionType = "eq";

export type EqualsFunction<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof equalsFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

/**
 * Creates an "equals" predicate (left === right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * **Note:** This is different from the {@link equals} rule! This predicate is for
 * conditional logic, while `equals()` is a validation rule.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left === right
 *
 * @example
 * // Check if status equals 'active'
 * eq(ref('status'), v('active'))
 *
 * @example
 * // Check if two fields are equal
 * eq(ref('password'), ref('confirmPassword'))
 *
 * @example
 * // Use in conditional rule
 * conditional({
 *   when: eq(ref('country'), v('US')),
 *   then: minLength(v(5))  // US zip codes are 5 digits
 * })
 *
 * @see {@link neq} - Not equals predicate
 * @see {@link equals} - Validation rule (not a predicate!)
 */
export function eq<const TLeft extends ParamaterValue, const TRight extends ParamaterValue>(
  left: TLeft,
  right: TRight
): EqualsFunction<TLeft, TRight> {
  return {
    type: equalsFunctionType,
    left,
    right,
  };
}

export function equalsFunction(left: ValueType | undefined, right: ValueType | undefined): boolean {
  return left === right;
}
