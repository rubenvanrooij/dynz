import { findSchemaByPath, getConditionDependencies, resolveProperty, SchemaType } from "dynz";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";

type ConditionalProperty = "mutable" | "required" | "included";

function getPropertyDependencies(
  path: string,
  property: ConditionalProperty,
  schema: Parameters<typeof findSchemaByPath>[1]
): string[] {
  const segments = path.split(/[.[\]]/).filter(Boolean);
  let previousAncestor: ReturnType<typeof findSchemaByPath> | undefined;

  return segments.flatMap((_, i) => {
    const ancestorPath = segments.slice(0, i + 1).join(".");
    const ancestor = findSchemaByPath(ancestorPath, schema);

    // A discriminated union's key-path alias (e.g. "$.left_side.type") resolves to the
    // SAME schema object as its own path ("$.left_side"), since the key isn't a real
    // nested field. Skip reprocessing it here: its included/required/mutable predicate
    // was already handled at its true (shallower) path, and reprocessing it here would
    // resolve any relative refs it contains against the wrong (deeper) base path.
    if (ancestor === previousAncestor) {
      return [];
    }
    previousAncestor = ancestor;

    // When ancestor is a discriminuted union the 'key' of the union
    // must always be added as an implicit dependency
    const dependencies =
      ancestor.type === SchemaType.DISCRIMINATED_UNION ? [`${ancestorPath}.${ancestor.key}`.slice(2)] : [];

    const ancestorPropertyValue = ancestor[property];

    if (ancestorPropertyValue === undefined || typeof ancestorPropertyValue === "boolean") {
      return dependencies;
    }

    return [
      ...dependencies,
      ...getConditionDependencies(ancestorPropertyValue, ancestorPath, schema).map((f) => f.slice(2)),
    ];
  });
}

export function useConditionalProperty(name: string, property: ConditionalProperty): boolean | undefined;
export function useConditionalProperty(names: string[], property: ConditionalProperty): (boolean | undefined)[];
export function useConditionalProperty(
  name: string | string[],
  property: ConditionalProperty
): boolean | undefined | (boolean | undefined)[];
export function useConditionalProperty(
  name: string | string[],
  property: ConditionalProperty
): boolean | undefined | (boolean | undefined)[] {
  const { getValues, schema, control } = useDynzFormContext();

  const names = Array.isArray(name) ? name : [name];
  const paths = names.map((n) => `$.${n}`);

  // Collect dependencies from each path AND all its ancestor paths.
  // A leaf field may carry a static included/required/mutable value, but an
  // ancestor may be conditionally excluded. resolveProperty short-circuits on the
  // first excluded ancestor, so those ancestor conditions must also be watched —
  // otherwise the hook never re-renders when the ancestor's controlling field changes.
  const dependencies = [...new Set(paths.flatMap((path) => getPropertyDependencies(path, property, schema)))];

  // Watch is just here to trigger a rerender when a value gets updated
  const watchedValues = useWatch({
    name: dependencies,
    control,
    // useWatch does not correctly respect dependencies after form submission; that's
    // why we need to stringify the value and use useMemo in order to prevent costly re-renders
    // When this is fixed in react-hook-form this optimization could be removed.
    compute: (val) => JSON.stringify(val),
    disabled: dependencies.length === 0,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: watchedValues triggers the re-evaluation
  return useMemo(() => {
    const values = getValues();
    const results = paths.map((path) => resolveProperty(property, path, true, { schema, values }));
    return Array.isArray(name) ? results : results[0];
  }, [name, property, schema, watchedValues]);
}
