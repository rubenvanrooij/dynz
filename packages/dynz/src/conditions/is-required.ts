import type { Schema } from "../types";
import { resolveProperty } from "./resolve-property";

/**
 * Resolves whether a given path is required in a schema for a given value
 *
 * @param schema
 * @param path
 * @param values
 * @returns boolean value whether the path is required
 */
export function isRequired<T extends Schema>(schema: T, path: string, values: unknown): boolean {
  return resolveProperty(schema, "required", path, true, {
    schema,
    values,
  });
}
