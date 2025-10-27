import { findSchemaByPath, getConditionDependencies, isRequired, type Schema } from "dynz";
import { useFormContext } from "react-hook-form";

export function useIsRequired(schema: Schema, path: string) {
  const { watch, getValues } = useFormContext();

  // No need to watch for value changes if the schema has no conditions on the mutable property
  const innerSchema = findSchemaByPath(path, schema);

  if (innerSchema.required === undefined || typeof innerSchema.required === "boolean") {
    return innerSchema.required === undefined ? true : innerSchema.required;
  }

  // Watch is just here to trigger a rerender when a value gets updated
  watch(getConditionDependencies(innerSchema.required, path).map((field) => field.slice(2)));
  

  return isRequired(schema, path, getValues());
}
