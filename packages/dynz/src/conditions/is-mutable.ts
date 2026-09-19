import type { Schema } from "../types";
import { resolveProperty } from "./resolve-property";

export function isMutable<T extends Schema>(
  rootSchema: T,
  path: string,
  values: unknown,
  resolvedRefs?: Map<string, Schema>
): boolean {
  return resolveProperty("mutable", path, true, {
    schema: rootSchema,
    values,
    ...(resolvedRefs !== undefined ? { resolvedRefs } : {}),
  });
}
