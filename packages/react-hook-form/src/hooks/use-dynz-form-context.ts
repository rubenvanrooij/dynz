import type { ObjectSchema, SchemaValues } from "dynz";
import { type FieldValues, useFormContext } from "react-hook-form";

export function useDynzFormContext<T extends ObjectSchema<never>, TFieldValues extends FieldValues>() {
  const context = useFormContext<TFieldValues, { schema: T }, SchemaValues<T>>();

  const schema = context.control._options.context?.schema;

  if (schema === undefined) {
    throw new Error("No schema found. Are you sure you setup your form with dynz?");
  }

  return {
    ...context,
    schema: schema,
  };
}
