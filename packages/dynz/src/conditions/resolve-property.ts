import { resolvePredicate } from "../functions";
import type { ResolveContext, Schema } from "../types";

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
  const prop = schema[property];

  if (prop === undefined) {
    return defaultValue;
  }

  if (typeof prop === "boolean") {
    return prop;
  }

  const resolved = resolvePredicate(prop, path, context);

  if (resolved === undefined) {
    return defaultValue;
  }

  return resolved;
}
