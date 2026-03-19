import type { ValueType } from "../../types";
import { isArray } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const isNotInFunctionType = "nin";

export type IsNotInFunction<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof isNotInFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

export function isNotIn<const TLeft extends ParamaterValue, const TRight extends ParamaterValue>(
  left: TLeft,
  right: TRight
): IsNotInFunction<TLeft, TRight> {
  return {
    type: isNotInFunctionType,
    left,
    right,
  };
}

export function isNotInFunction(left: ValueType | undefined, right: ValueType | undefined): boolean | undefined {
  if (!isArray(right) || left === undefined) {
    return undefined;
  }

  return !right.includes(left);
}
