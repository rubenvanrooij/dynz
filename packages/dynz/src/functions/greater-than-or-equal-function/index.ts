import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const greaterThanOrEqualFunctionType = "gte";

export type GreaterThanOrEqualFunction<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof greaterThanOrEqualFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

/**
 * Creates a "greater than or equal" predicate (left >= right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left >= right
 *
 * @example
 * // Check if age is at least 18
 * gte(ref('age'), v(18))
 *
 * @example
 * // Check if price covers cost
 * gte(ref('price'), ref('cost'))
 *
 * @see {@link gt} - Greater than (>)
 * @see {@link lt} - Less than (<)
 * @see {@link lte} - Less than or equal (<=)
 * @see {@link min} - Rule for minimum value validation
 */
export function gte<const TLeft extends ParamaterValue, const TRight extends ParamaterValue>(
  left: TLeft,
  right: TRight
): GreaterThanOrEqualFunction<TLeft, TRight> {
  return {
    type: greaterThanOrEqualFunctionType,
    left,
    right,
  };
}

export function greaterThanOrEqualFunction(
  left: ValueType | undefined,
  right: ValueType | undefined
): boolean | undefined {
  if (left === undefined || right === undefined || left === null || right === null) {
    return undefined;
  }
  return +left >= +right;
}
