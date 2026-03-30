import type { Schema } from "../types";
import { resolveProperty } from "./resolve-property";

export function isMutable<T extends Schema>(schema: T, path: string, values: unknown): boolean {
  return resolveProperty(schema, "mutable", path, true, {
    schema,
    values,
  });
}
