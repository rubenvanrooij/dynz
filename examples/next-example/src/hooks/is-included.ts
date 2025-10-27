import { findSchemaByPath, isIncluded, type Schema } from "dynz";
import { useFormContext } from "react-hook-form";

export function useIsIncluded(schema: Schema, path: string) {
  const { watch } = useFormContext();

  // No need to watch for value changes if the schema has no conditions on the included property
  const innerSchema = findSchemaByPath(path, schema);

  if (innerSchema.included === undefined || typeof innerSchema.included === "boolean") {
    return innerSchema.included;
  }

  const values = watch();

  return isIncluded(schema, path, values);
}
