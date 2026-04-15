import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import { isArray } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const isInFunctionType = "in";

export type IsInFunction<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof isInFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

export function isIn<
  const TLeft extends ParamaterValue | number | string | boolean | Date,
  const TRight extends ParamaterValue | number | string | boolean | Date,
>(left: TLeft, right: TRight): IsInFunction<ToParam<TLeft>, ToParam<TRight>> {
  return {
    type: isInFunctionType,
    left: toParamaterValue(left),
    right: toParamaterValue(right),
  };
}

export function isInFunction(left: ValueType | undefined, right: ValueType | undefined): boolean {
  if (!isArray(right) || left === undefined) {
    return false;
  }

  return right.includes(left);
}
