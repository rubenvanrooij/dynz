import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import { isString } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const matchesFunctionType = "matches";

export type MatchesFunction<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof matchesFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
  flags?: string | undefined;
};

export function matches<
  const TLeft extends ParamaterValue<string> | string,
  const TRight extends ParamaterValue<string> | string,
>(left: TLeft, right: TRight, flags?: string): MatchesFunction<ToParam<TLeft>, ToParam<TRight>> {
  return {
    type: matchesFunctionType,
    left: toParamaterValue(left),
    right: toParamaterValue(right),
    flags,
  };
}

export function matchesFunction(
  left: ValueType | undefined,
  right: ValueType | undefined,
  flags?: string
): boolean | undefined {
  if (left === undefined || left === null || isString(right) === false) {
    return undefined;
  }
  return new RegExp(right, flags).test(left.toString());
}
