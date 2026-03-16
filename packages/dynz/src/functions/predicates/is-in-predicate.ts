import type { ValueType } from "../../types";
import { isArray } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const isInPredicateType = "in";

export type IsInPredicate<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof isInPredicateType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

export function isIn<const TLeft extends ParamaterValue, const TRight extends ParamaterValue>(
  left: TLeft,
  right: TRight
): IsInPredicate<TLeft, TRight> {
  return {
    type: isInPredicateType,
    left,
    right,
  };
}

export function isInPredicate(left: ValueType | undefined, right: ValueType | undefined): boolean {
  if (!isArray(right) || left === undefined) {
    return false;
  }

  return right.includes(left);
}
