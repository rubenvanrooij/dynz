import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const lookupFunctionType = "lookup";

export type LookupFunction<TValue extends ParamaterValue = never, TLookup extends ParamaterValue = never> = {
  type: typeof lookupFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
  lookup: [TLookup] extends [never] ? ParamaterValue : TLookup;
};

export function lookup<
  const TValue extends ParamaterValue = never,
  const TLookup extends ParamaterValue = never,
>(input: { value: TValue; lookup: TLookup }): LookupFunction<TValue, TLookup> {
  return {
    type: lookupFunctionType,
    ...input,
  };
}

export function lookupFunction(value: ValueType | undefined, lookup: ValueType | undefined): ValueType | undefined {
  if (value === undefined || typeof lookup !== "object") {
    return undefined;
  }

  return lookup[value];
}
