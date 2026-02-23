import type { ValueType } from "..";

export const REFERENCE_TYPE = "_dref" as const;

export type Reference<T extends string = string> = {
  readonly type: typeof REFERENCE_TYPE;
  readonly path: T;
};

export function isReference(value: unknown): value is Reference {
  return (
    typeof value === "object" && value !== null && "type" in value && value.type === REFERENCE_TYPE && "path" in value
  );
}

/**
 * Describes either a value or a reference.
 */
export type ValueOrReference<T extends ValueType = ValueType> = T | Reference;

export function ref<const T extends string>(path: T): Reference<T> {
  return {
    type: REFERENCE_TYPE,
    path,
  };
}
