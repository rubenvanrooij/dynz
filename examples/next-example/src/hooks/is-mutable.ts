import { findSchemaByPath, isMutable, type Schema } from "dynz";
import { useFormContext } from "react-hook-form";

export function useIsMutable(schema: Schema, path: string) {
  const { watch } = useFormContext();

  // No need to watch for value changes if the schema has no conditions on the mutable property
  const innerSchema = findSchemaByPath(path, schema);

  if (innerSchema.mutable === undefined || typeof innerSchema.mutable === "boolean") {
    return innerSchema.mutable;
  }

  const values = watch();

  return isMutable(schema, path, values);
}
