import type { Reference } from "../reference";
import type { JsonPrimitive } from "./../types";

export const EPRESSION_TYPE = "__dexpr" as const;

export type Expression<T extends string, C extends Record<string, JsonPrimitive | Reference>> = {
  _type: typeof EPRESSION_TYPE;
  expr: T;
  context: C;
};

export function expr<const T extends string, const C extends Record<string, JsonPrimitive | Reference>>(
  expr: T,
  context: C
): Expression<T, C> {
  return {
    _type: EPRESSION_TYPE,
    expr,
    context,
  };
}
