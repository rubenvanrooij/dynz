import type { Schema } from "../types";
import { getNested } from "../utils";
import { resolveProperty } from "./resolve-property";

export function isMutable<T extends Schema>(schema: T, path: string, values: unknown): boolean {
  const nested = getNested(path, schema, values);

  return resolveProperty(nested.schema, "mutable", path, true, {
    schema,
    values: {
      new: values,
    },
  });
}
