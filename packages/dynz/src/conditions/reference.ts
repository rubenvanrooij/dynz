import type { ValueType } from "..";

export const REFERENCE_TYPE = "__dref" as const;

export type Reference<T extends string = string> = {
  readonly _type: typeof REFERENCE_TYPE;
  readonly path: T;
};

/**
 * Describes either a value or a reference.
 */
export type ValueOrReference<T extends ValueType = ValueType> = T | Reference;

export function ref<const T extends string>(path: T): Reference<T> {
  return {
    _type: REFERENCE_TYPE,
    path,
  };
}
