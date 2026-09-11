import { resolvePredicate } from "../functions";
import type { OptionsSchema } from "../schemas";
import { type Schema, SchemaType } from "../types";
import { ensureAbsolutePath, findSchemaByPath } from "../utils";

/**
 * Resolves the enabled/value pairs of an `options()` field against a concrete
 * `values` document — the framework-agnostic core of what each integration's
 * `useOptions` hook/composable does.
 *
 * `name` is the options field's path; it may be relative (e.g. `"plan"`,
 * resolved against the schema root) or already absolute (e.g. `"$.plan"`).
 *
 * A plain option (not `{ enabled, value }`) is always enabled. A dynamic
 * option's `enabled` is either a static boolean or a `Predicate`, resolved
 * against `values`; resolution failure (`undefined`) falls back to `false`
 * rather than treating the option as enabled.
 *
 * ```ts
 * const schema = object({
 *   plan: options([
 *     "free",
 *     { value: "pro", enabled: eq(ref("hasSubscription"), true) },
 *   ]),
 * });
 *
 * getOptions("plan", schema, { hasSubscription: false });
 * // [
 * //   { value: "free", enabled: true },
 * //   { value: "pro", enabled: false },
 * // ]
 * ```
 */
export function getOptions<T extends Schema>(
  name: string,
  schema: T,
  values: unknown
): Array<{ enabled: boolean; value: string | number | boolean }> {
  const path = ensureAbsolutePath(name, "$");
  const optionsSchema = findSchemaByPath<OptionsSchema>(path, schema, SchemaType.OPTIONS);
  return getOptionsForSchema(optionsSchema, path, schema, values);
}

/**
 * Resolves the enabled/value pairs for an already-resolved `OptionsSchema`.
 *
 * Split out from `getOptions` so callers that already hold an `OptionsSchema`
 * (e.g. one found while walking a nested/array field) can reuse the same
 * predicate-resolution logic without re-deriving the schema from a field name.
 *
 * `path` must be the schema-*absolute* path of the options field itself (e.g.
 * `"$.address.plan"`, not `"address.plan"` or `"$"`) — it's used to resolve a
 * dynamic option's `enabled` predicate against `values`, and matters because a
 * relative `ref(...)` inside that predicate resolves against `path`'s own
 * siblings: passing the wrong path silently resolves the ref against the
 * wrong field (or the schema root).
 */
export function getOptionsForSchema<T extends Schema>(
  schema: OptionsSchema,
  path: string,
  rootSchema: T,
  values: unknown
): Array<{ enabled: boolean; value: string | number | boolean }> {
  return schema.options.map((option) => {
    if (typeof option !== "object") {
      return { value: option, enabled: true };
    }

    if (typeof option.enabled === "boolean") {
      return { value: option.value, enabled: option.enabled };
    }

    return {
      value: option.value,
      enabled: resolvePredicate(option.enabled, path, { schema: rootSchema, values }) ?? false,
    };
  });
}
