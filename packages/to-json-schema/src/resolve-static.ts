import type { ParamaterValue, ValueType } from "dynz";

export type StaticResolution<T extends ValueType = ValueType> = { ok: true; value: T } | { ok: false };

/**
 * Attempts to extract a literal value from a rule parameter. Only values
 * wrapped with `v()`/`val()`/`st()` (i.e. `{ type: "st" }`) are statically
 * known — references, predicates and transformers depend on runtime data
 * and cannot be represented in a JSON Schema document.
 */
export function resolveStatic<T extends ValueType = ValueType>(
  value: ParamaterValue<T> | undefined
): StaticResolution<T> {
  if (value !== undefined && typeof value === "object" && "type" in value && value.type === "st") {
    return { ok: true, value: value.value };
  }

  return { ok: false };
}
