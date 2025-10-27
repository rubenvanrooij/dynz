import { findSchemaByPath, getConditionDependencies, isIncluded, type Schema } from "dynz";
import { useFormContext } from "react-hook-form";

export function useIsIncluded(schema: Schema, path: string) {
  const { watch, getValues } = useFormContext();

  // No need to watch for value changes if the schema has no conditions on the included property
  const innerSchema = findSchemaByPath(path, schema);

  if (innerSchema.included === undefined || typeof innerSchema.included === "boolean") {
    return innerSchema.included;
  }

  // Watch is just here to trigger a rerender when a value gets updated
  watch(getConditionDependencies(innerSchema.included, path).map((field) => field.slice(2)));
  
  return isIncluded(schema, path, getValues());
}
