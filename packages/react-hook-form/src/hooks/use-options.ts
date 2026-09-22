import { findSchemaByPath, getConditionDependencies, getOptionsForSchema, type OptionsSchema, SchemaType } from "dynz";
import { useWatch } from "react-hook-form";
import { getUnionKeyDependencies } from "./get-union-key-dependencies";
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
  "use no memo";
  const { control, getValues, schema: rootSchema } = useDynzFormContext();

  const dependencies = schema.options.reduce<string[]>(
    (acc, option) => {
      if (typeof option === "object" && typeof option.enabled !== "boolean") {
        acc.push(...getConditionDependencies(option.enabled, fieldPath, rootSchema));
      }

      return acc;
    },
    getUnionKeyDependencies(fieldPath, rootSchema).map((dep) => `$.${dep}`)
  );

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
  const { schema, getValues } = useDynzFormContext();
  const fieldPath = `$.${name}`;
  const inner = findSchemaByPath<OptionsSchema>(fieldPath, schema, SchemaType.OPTIONS, getValues());

  return useOptionsSchema(inner, fieldPath);
}
