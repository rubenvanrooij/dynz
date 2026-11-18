import { findPossibleSchemasByPath, getConditionDependencies, resolveProperty, type Schema } from "dynz";
import { useSyncExternalStore } from "react";
import { useWatch } from "react-hook-form";
import { getUnionKeyDependencies } from "./get-union-key-dependencies";
import { useDynzFormContext } from "./use-dynz-form-context";

type ConditionalProperty = "mutable" | "required" | "included";

function getPropertyDependencies(path: string, property: ConditionalProperty, schema: Schema): string[] {
  const segments = path.split(/[.[\]]/).filter(Boolean);
  const propertyDependencies = segments.flatMap((_, i) => {
    const ancestorPath = segments.slice(0, i + 1).join(".");
    return findPossibleSchemasByPath(ancestorPath, schema).flatMap((ancestor) => {
      const ancestorPropertyValue = ancestor[property];

      if (ancestorPropertyValue === undefined || typeof ancestorPropertyValue === "boolean") {
        return [];
      }

      return getConditionDependencies(ancestorPropertyValue, ancestorPath, schema).map((f) => f.slice(2));
    });
  });

  // A discriminated union's key is always an implicit dependency — it decides which
  // member's conditions apply in the first place.
  return [...getUnionKeyDependencies(path, schema), ...propertyDependencies];
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
  const { getValues, schema, control, resources } = useDynzFormContext();

  const names = Array.isArray(name) ? name : [name];
  const paths = names.map((n) => `$.${n}`);

  // Collect dependencies from each path AND all its ancestor paths.
  // A leaf field may carry a static included/required/mutable value, but an
  // ancestor may be conditionally excluded. resolveProperty short-circuits on the
  // first excluded ancestor, so those ancestor conditions must also be watched —
  // otherwise the hook never re-renders when the ancestor's controlling field changes.
  const dependencies = [...new Set(paths.flatMap((path) => getPropertyDependencies(path, property, schema)))];

  // Watch is just here to trigger a rerender when a value gets updated
  useWatch({
    name: dependencies,
    control,
    // useWatch does not correctly respect dependencies after form submission; that's
    // why we need to stringify the value and use useMemo in order to prevent costly re-renders
    // When this is fixed in react-hook-form this optimization could be removed.
    compute: (val) => JSON.stringify(val),
    disabled: dependencies.length === 0,
  });

  // The snapshot is the results as a string, so a change in the resources only re-renders
  // this hook when one of its results flips.
  const getSnapshot = () =>
    paths
      .map((path) =>
        resolveProperty(property, path, true, { schema, values: getValues(), resources: resources.getStates() })
      )
      .join(",");
  const snapshot = useSyncExternalStore(resources.subscribe, getSnapshot, getSnapshot);

  const results = snapshot === "" ? [] : snapshot.split(",").map((result) => result === "true");
  return Array.isArray(name) ? results : results[0];
}
