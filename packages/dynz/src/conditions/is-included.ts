import type { Schema } from "../types";
import { ensureAbsolutePath, getNested } from "../utils";
import { resolveProperty } from "./resolve-property";

/**
 * Resolves whether a given path is included in a schema for a given value
 *
 * @example
 * // returns true
 * const schema = object({
 *  fields: {
 *   one: number()
 *   two: number({
 *    included: eq('one', 1)
 *   })
 *  }
 * })
 *
 * isIncluded(schema, '$.two', { one: 1 })
 *
 * @param schema
 * @param path
 * @param values
 * @returns boolean value whether the path is included
 */
export function isIncluded<T extends Schema>(schema: T, path: string, values: unknown): boolean {
  const segments = ensureAbsolutePath(path, "$")
    .split(/[.[\]]/)
    .filter(Boolean);

  // Check each ancestor path prefix (starting from first real field, skipping root "$")
  for (let i = 1; i <= segments.length; i++) {
    const currentPath = segments.slice(0, i).join(".");
    const nested = getNested(currentPath, schema, values);
    const included = resolveProperty(nested.schema, "included", currentPath, true, {
      schema,
      values,
    });

    if (!included) return false;
  }

  return true;
}
