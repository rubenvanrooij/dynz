import type { ValueType } from "../../types";
import { isArray } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const isNotInPredicateType = "nin";

export type IsNotInPredicate<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof isNotInPredicateType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

export function isNotIn<const TLeft extends ParamaterValue, const TRight extends ParamaterValue>(
  left: TLeft,
  right: TRight
): IsNotInPredicate<TLeft, TRight> {
  return {
    type: isNotInPredicateType,
    left,
    right,
  };
}

export function isNotInPredicate(left: ValueType | undefined, right: ValueType | undefined): boolean | undefined {
  if (!isArray(right) || left === undefined) {
    return undefined;
  }

  return !right.includes(left);
}
