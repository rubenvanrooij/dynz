import type { ValueType } from "../../types";
import { isString } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const matchesPredicateType = "matches";

export type MatchesPredicate<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof matchesPredicateType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
  flags?: string | undefined;
};

export function matches<const TLeft extends ParamaterValue, const TRight extends ParamaterValue>(
  left: TLeft,
  right: TRight,
  flags?: string
): MatchesPredicate<TLeft, TRight> {
  return {
    type: matchesPredicateType,
    left,
    right,
    flags,
  };
}

export function matchesPredicate(
  left: ValueType | undefined,
  right: ValueType | undefined,
  flags?: string
): boolean | undefined {
  if (left === undefined || isString(right) === false) {
    return undefined;
  }
  return new RegExp(right, flags).test(left.toString());
}
