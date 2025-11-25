import { findSchemaByPath, getConditionDependencies, getNested, resolveProperty } from "dynz";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";

export function useConditionalProperty(
  name: string,
  property: "mutable" | "required" | "included"
): boolean | undefined {
  const { getValues, schema, control } = useDynzFormContext();

  const path = `$.${name}`;

  // No need to watch for value changes if the schema has no conditions on the mutable property
  const innerSchema = findSchemaByPath(path, schema);

  const propertyValue = innerSchema[property];

  const dependencies =
    propertyValue === undefined || typeof propertyValue === "boolean"
      ? []
      : getConditionDependencies(propertyValue, path).map((field) => field.slice(2));

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: watchedValues triggers the re evealuation
  return useMemo(() => {
    const values = getValues();
    const nested = getNested(path, schema, values);

    return resolveProperty(nested.schema, property, path, true, {
      schema,
      values: {
        new: values,
      },
    });
  }, [innerSchema, property, path, schema, watchedValues]);
}
