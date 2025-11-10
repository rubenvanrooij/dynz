import { findSchemaByPath, getConditionDependencies, getNested, isMutable, resolveProperty } from "dynz";
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

  // Watch is just here to trigger a rerender when a value gets updated
  useWatch({
    name:
      propertyValue === undefined || typeof propertyValue === "boolean"
        ? []
        : getConditionDependencies(propertyValue, path).map((field) => field.slice(2)),
    control,
  });

  if (innerSchema[property] === undefined) {
    return true;
  }

  if (typeof innerSchema[property] === "boolean") {
    return innerSchema[property];
  }

  const values = getValues();
  const nested = getNested(path, schema, values);

  return resolveProperty(nested.schema, property, path, true, {
    schema,
    values: {
      new: values,
    },
  });
}
