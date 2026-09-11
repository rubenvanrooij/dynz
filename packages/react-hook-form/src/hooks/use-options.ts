import { findSchemaByPath, getConditionDependencies, getOptionsForSchema, type OptionsSchema, SchemaType } from "dynz";
import { useWatch } from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";

/**
 * Resolves the enabled/value pairs for an already-resolved `OptionsSchema`.
 *
 * Split out from `useOptions` so callers that already hold an `OptionsSchema`
 * (e.g. one found while walking a nested/array field) can reuse the same
 * dependency-tracking and predicate-resolution logic without re-deriving the
 * schema from a field name.
 *
 * `fieldPath` must be the schema-*absolute* path of the options field itself
 * (default `"$"` for a root options field) — it's used both to compute which
 * fields a dynamic option's `enabled` predicate depends on, and to resolve
 * that predicate against the current form values.
 */
export function useOptionsSchema(
  schema: OptionsSchema,
  fieldPath: string = "$"
): Array<{ enabled: boolean; value: string | number | boolean }> {
  // Opt out of React Compiler memoization: this hook reads live form values via
  // getValues() and relies on useWatch below to trigger rerenders, not on
  // props/state identity, so compiler-inferred memoization would be unsafe here.
  "use no memo";
  const { control, getValues, schema: rootSchema } = useDynzFormContext();

  // TODO: memoize
  const dependencies = schema.options.reduce<string[]>((acc, option) => {
    if (typeof option === "object" && typeof option.enabled !== "boolean") {
      acc.push(...getConditionDependencies(option.enabled, fieldPath, rootSchema));
    }

    return acc;
  }, []);

  // Watch is just here to trigger a rerender when a value gets updated
  useWatch({
    name: dependencies.map((dep) => dep.slice(2)),
    control,
  });

  return getOptionsForSchema(schema, fieldPath, rootSchema, getValues());
}

/**
 * Looks up the `OptionsSchema` for `name` (a form path relative to the schema
 * root, e.g. "someField") and resolves its enabled/value pairs.
 */
export function useOptions(name: string): Array<{ enabled: boolean; value: string | number | boolean }> {
  "use no memo";
  const { schema } = useDynzFormContext();
  const fieldPath = `$.${name}`;
  const inner = findSchemaByPath<OptionsSchema>(fieldPath, schema, SchemaType.OPTIONS);

  return useOptionsSchema(inner, fieldPath);
}
