import type { Schema } from "../types";
import { getNested } from "../utils";
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
  const nested = getNested(path, schema, values);

  return resolveProperty(nested.schema, "included", path, true, {
    schema,
    values: {
      new: values,
    },
  });
}
