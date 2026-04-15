import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const lookupFunctionType = "lookup";

export type LookupFunction<TValue extends ParamaterValue = never, TLookup extends ParamaterValue = never> = {
  type: typeof lookupFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
  lookup: [TLookup] extends [never] ? ParamaterValue : TLookup;
};

export function lookup<
  const TValue extends ParamaterValue | number | string,
  const TLookup extends ParamaterValue,
>(input: { value: TValue; lookup: TLookup }): LookupFunction<ToParam<TValue>, TLookup> {
  return {
    type: lookupFunctionType,
    value: toParamaterValue(input.value),
    lookup: input.lookup,
  };
}

export function lookupFunction(value: ValueType | undefined, lookup: ValueType | undefined): ValueType | undefined {
  if (value === undefined || value === null || lookup === null || typeof lookup !== "object") {
    return undefined;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  return (lookup as Record<string | number, ValueType>)[value];
}
