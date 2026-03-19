import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const lowerThanOrEqualFunctionType = "lte";

export type LowerThanOrEqualFunction<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof lowerThanOrEqualFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

/**
 * Creates a "less than or equal" predicate (left <= right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left <= right
 *
 * @example
 * // Check if age is at most the minor age
 * lte(age(ref('birthDate')), v(18))
 *
 * @example
 * // Ensure discount doesn't exceed price
 * lte(ref('discount'), ref('price'))
 *
 * @see {@link lt} - Less than (<)
 * @see {@link gt} - Greater than (>)
 * @see {@link gte} - Greater than or equal (>=)
 * @see {@link max} - Rule for maximum value validation
 */
export function lte<const TLeft extends ParamaterValue, const TRight extends ParamaterValue>(
  left: TLeft,
  right: TRight
): LowerThanOrEqualFunction<TLeft, TRight> {
  return {
    type: lowerThanOrEqualFunctionType,
    left,
    right,
  };
}

export function lowerThanOrEqualFunction(
  left: ValueType | undefined,
  right: ValueType | undefined
): boolean | undefined {
  if (left === undefined || right === undefined) {
    return undefined;
  }
  return +left <= +right;
}
