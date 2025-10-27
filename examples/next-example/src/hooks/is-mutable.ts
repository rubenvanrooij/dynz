import { findSchemaByPath, getConditionDependencies, isMutable, type Schema } from "dynz";
import { useFormContext } from "react-hook-form";

export function useIsMutable(schema: Schema, path: string) {
  const { watch, getValues } = useFormContext();

  // No need to watch for value changes if the schema has no conditions on the mutable property
  const innerSchema = findSchemaByPath(path, schema);

  if (innerSchema.mutable === undefined || typeof innerSchema.mutable === "boolean") {
    return innerSchema.mutable;
  }

  // Watch is just here to trigger a rerender when a value gets updated
  watch(getConditionDependencies(innerSchema.mutable, path).map((field) => field.slice(2)));
  
  return isMutable(schema, path, getValues());
}
