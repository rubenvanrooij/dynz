import { type Predicate, resolvePredicate } from "../functions";
import { type ResolveContext, type Schema, SchemaType } from "../types";
import { getNested } from "../utils";
import { isObject } from "../validate/validate-type";

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

  // Walk every ancestor prefix from the root down to (and including) the target path.
  // For each prefix we check whether the schema at that level has the property set —
  // e.g. an ancestor object being not-included makes all its children not-included too.
  for (let i = 1; i <= segments.length; i++) {
    const currentPath = segments.slice(0, i).join(".");
    const nested = getNested(currentPath, context.schema, context.values);

    // getNested returns null when the path cannot be resolved — this happens when
    // navigating through a discriminated union whose discriminator value does not
    // match any member (e.g. the field is empty or the current value is an excluded
    // member). Treat this as "not accessible" → behave as if not included.
    if (nested === null) {
      return false;
    }

    const ret = _resolveProperty(nested.schema, property, currentPath, defaultValue, context);

    if (!ret) {
      return false;
    }

    if (
      nested.schema.type === SchemaType.DISCRIMINATED_UNION &&
      i < segments.length &&
      segments[i] !== nested.schema.key &&
      isObject(nested.value)
    ) {
      const key = nested.schema.key;
      const discriminatorValue = nested.value[key];

      const matchingMember = nested.schema.schemas.find((s) => {
        const discriminatorField = s.fields[key];
        if (discriminatorField === undefined) {
          return false;
        }

        if (discriminatorField.type !== SchemaType.LITERAL) {
          // only literal type discriminators are alowed
          return false;
        }

        return discriminatorField.value === discriminatorValue;
      });

      // If we found a matching member, check whether it has the property set.
      // A non-included member means none of its fields should be rendered —
      // return false so the caller (e.g. isIncluded) hides those fields.
      if (matchingMember !== undefined) {
        if (!_resolveProperty(matchingMember, property, currentPath, defaultValue, context)) {
          return false;
        }
      }
    }
  }

  return _resolveProperty(context.schema, property, path, defaultValue, context);
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

  const resolved = resolvePredicate(prop as Predicate, path, context);

  if (resolved === undefined) {
    return defaultValue;
  }

  return resolved;
}
