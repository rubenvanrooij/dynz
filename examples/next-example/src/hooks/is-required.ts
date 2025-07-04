import { findSchemaByPath, isRequired, type Schema } from "dynz";
import { useFormContext } from "react-hook-form";

export function useIsRequired(schema: Schema, path: string) {
  const { watch } = useFormContext();

  // No need to watch for value changes if the schema has no conditions on the mutable property
  const innerSchema = findSchemaByPath(path, schema);

  if (innerSchema.required === undefined || typeof innerSchema.required === "boolean") {
    return innerSchema.required === undefined ? true : innerSchema.required;
  }

  const values = watch();

  return isRequired(schema, path, values);
}
