import type { Schema } from "../types";
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
export function isIncluded<T extends Schema>(rootSchema: T, path: string, values: unknown): boolean {
  return resolveProperty("included", path, true, {
    schema: rootSchema,
    values,
  });
}
