import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const greaterThanPredicateType = "gt";

export type GreaterThanPredicate<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof greaterThanPredicateType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

/**
 * Creates a "greater than" predicate (left > right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left > right
 *
 * @example
 * // Check if age is greater than 18
 * gt(ref('age'), v(18))
 *
 * @example
 * // Compare two field values
 * gt(ref('price'), ref('cost'))
 *
 * @example
 * // Use with transformer
 * gt(age(ref('birthDate')), v(21))
 *
 * @see {@link gte} - Greater than or equal (>=)
 * @see {@link lt} - Less than (<)
 * @see {@link lte} - Less than or equal (<=)
 * @see {@link min} - Rule for minimum value validation
 */
export function gt<const TLeft extends ParamaterValue, const TRight extends ParamaterValue>(
  left: TLeft,
  right: TRight
): GreaterThanPredicate<TLeft, TRight> {
  return {
    type: greaterThanPredicateType,
    left,
    right,
  };
}

export function greaterThanPredicate(left: ValueType | undefined, right: ValueType | undefined): boolean | undefined {
  if (left === undefined || right === undefined) {
    return undefined;
  }
  return +left > +right;
}
