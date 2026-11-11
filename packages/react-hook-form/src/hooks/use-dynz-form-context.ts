import type { ObjectSchema, RulesDependencyMap, SchemaValues } from "dynz";
import { type FieldValues, useFormContext } from "react-hook-form";
import { createResourceStore, type ResourceStore } from "./resource-store";

/** For forms set up without `useDynzForm`'s store: no resources, never notifies. */
const NO_RESOURCES = createResourceStore();

export function useDynzFormContext<T extends ObjectSchema<never>, TFieldValues extends FieldValues>() {
  const context = useFormContext<
    TFieldValues,
    { schema: T; dependencies: RulesDependencyMap; resources?: ResourceStore; name?: string | undefined },
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

  const getDependencies = (name: string) => {
    const deps = dependencies.reverse[`$.${name}`];
    return deps ? [...deps].map((v) => v.slice(2)) : undefined;
  };

  return {
    ...context,
    schema: schema,
    name: context.control._options.context?.name,
    resources: context.control._options.context?.resources ?? NO_RESOURCES,
    getDependencies: getDependencies,
  };
}
