import { resolvePredicate } from "../functions";
import type { Context, ResolveContext, Schema } from "../types";
import { ensureAbsolutePath, getNested } from "../utils";

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

// TODO: FIX
// /**
//  * Resolves one of the following properties: required, mutable, included on a
//  * schema
//  */
// export function resolveProperty2<T extends Schema>(
//   property: "required" | "mutable" | "included",
//   path: string,
//   defaultValue: boolean,
//   context: ResolveContext
// ): boolean {

//   const segments = ensureAbsolutePath(path, '$').split(/[.[\]]/).filter(Boolean);

//   // Check each ancestor path prefix (starting from first real field, skipping root "$")
//   for (let i = 1; i <= segments.length; i++) {

//     const currentPath = segments.slice(0, i).join(".");

//     // Retrieve the schema for the current path
//     const { schema } = getNested(currentPath, context.schema, context.values);

//     const prop = schema[property];

//     if (i === segments.length - 1) {
//       if (prop === undefined) {
//         return defaultValue;
//       }

//       if (typeof prop === "boolean") {
//         return prop;
//       }

//       const resolved = resolvePredicate(prop, path, context);

//       if (resolved === undefined) {
//         return defaultValue;
//       }
//     } else {

//       if (prop === undefined) {
//         continue;
//       }

//       const included = typeof prop === "boolean" ? prop : resolvePredicate(prop, path, context);

//       if (!included) {

//       }
//     }

//     if (prop === undefined) {
//       return defaultValue;
//     }

//     if (typeof prop === "boolean") {
//       return prop;
//     }

//     const resolved = resolvePredicate(prop, path, context);

//     if (resolved === undefined) {
//       return defaultValue;
//     }

//     const included = resolveProperty(nested.schema, "included", currentPath, true, context);

//     if (!included) return false;
//   }

//   return true;

//   const prop = schema[property];

//   if (prop === undefined) {
//     return defaultValue;
//   }

//   if (typeof prop === "boolean") {
//     return prop;
//   }

//   const resolved = resolvePredicate(prop, path, context);

//   if (resolved === undefined) {
//     return defaultValue;
//   }

//   return resolved;
// }
