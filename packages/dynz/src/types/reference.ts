import type { ValueType } from "./schema";

export const REFERENCE_TYPE = "__dref" as const;

export type Reference<T extends string = string> = {
  readonly _type: typeof REFERENCE_TYPE;
  readonly path: T;
};

/**
 * Describes either a value or a reference.
 */
export type ValueOrReference<T extends ValueType = ValueType> = T | Reference;
