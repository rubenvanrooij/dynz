import type { ResolveContext, Schema } from "../types";
import { resolveCondition } from "./resolve-condition";

/**
 * Resolves one of the following properties: required, mutable, included on a
 * schema
 */
export function resolveProperty<T extends Schema>(
  schema: T,
  property: "required" | "mutable" | "included",
  path: string,
  defaultValue: boolean,
  context: ResolveContext
): boolean {
  if (schema[property] === undefined) {
    return defaultValue;
  }

  return typeof schema[property] === "boolean" ? schema[property] : resolveCondition(schema[property], path, context);
}
