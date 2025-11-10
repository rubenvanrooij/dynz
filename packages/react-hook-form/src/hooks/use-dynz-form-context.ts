import type { ObjectSchema, SchemaValues } from "dynz";
import { type FieldValues, useFormContext } from "react-hook-form";

export function useDynzFormContext<T extends ObjectSchema<never>, TFieldValues extends FieldValues>() {
  const context = useFormContext<
    TFieldValues,
    { schema: T; dependencies: { dependencies: Record<string, Set<string>>; reverse: Record<string, Set<string>> } },
    SchemaValues<T>
  >();

  const schema = context.control._options.context?.schema;
  const dependencies = context.control._options.context?.dependencies;

  if (schema === undefined) {
    throw new Error("No schema found. Are you sure you setup your form with dynz?");
  }

  if (dependencies === undefined) {
    throw new Error("No dependencies map found. Are you sure you setup your form with dynz?");
  }

  return {
    ...context,
    schema: schema,
    dependencies: dependencies,
  };
}
