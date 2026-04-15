import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const lowerThanFunctionType = "lt";

export type LowerThanFunction<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof lowerThanFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

/**
 * Creates a "less than" predicate (left < right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left < right
 *
 * @example
 * // Check if quantity is under limit
 * lt(ref('quantity'), v(100))
 *
 * @example
 * // Compare two field values
 * lt(ref('startDate'), ref('endDate'))
 *
 * @see {@link lte} - Less than or equal (<=)
 * @see {@link gt} - Greater than (>)
 * @see {@link gte} - Greater than or equal (>=)
 * @see {@link max} - Rule for maximum value validation
 */
export function lt<
  const TLeft extends ParamaterValue<number> | number,
  const TRight extends ParamaterValue<number> | number,
>(left: TLeft, right: TRight): LowerThanFunction<ToParam<TLeft>, ToParam<TRight>> {
  return {
    type: lowerThanFunctionType,
    left: toParamaterValue(left),
    right: toParamaterValue(right),
  };
}

export function lowerThanFunction(left: ValueType | undefined, right: ValueType | undefined): boolean | undefined {
  if (left === undefined || right === undefined || left === null || right === null) {
    return undefined;
  }
  return +left < +right;
}
