import { resolvePredicate } from "../functions";
import type { ResolveContext, Schema } from "../types";
import { getNested } from "../utils";

export function resolveProperty<T extends Schema>(
  property: "required" | "mutable" | "included",
  path: string,
  defaultValue: boolean,
  context: ResolveContext<T>
) {
  if (!path.startsWith("$")) {
    throw new Error("resolveProperty must be called with an absolute path");
  }

  const segments = path.split(/[.[\]]/).filter(Boolean);

  // Check each ancestor path prefix (starting from first real field, skipping root "$")
  for (let i = 1; i <= segments.length; i++) {
    const currentPath = segments.slice(0, i).join(".");
    const nested = getNested(currentPath, context.schema, context.values);
    const included = _resolveProperty(nested.schema, property, currentPath, defaultValue, context);

    if (!included) return false;
  }

  return true;
}

/**
 * Resolves one of the following properties: required, mutable, included on a
 * schema
 */
export function _resolveProperty<T extends Schema>(
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
