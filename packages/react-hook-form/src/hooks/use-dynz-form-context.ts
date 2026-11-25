import type { CurrentResource } from "@dynz/form-resources";
import type { ObjectSchema, ResourceStates, RulesDependencyMap, SchemaValues } from "dynz";
import { createContext, useContext } from "react";
import { type FieldValues, useFormContext } from "react-hook-form";

/** The resources `useDynzForm` returns (and `DynzFormProvider` provides). */
export type DynzFormResources = {
  /** Every enabled resource instance, by path (`$.vehicle`, `$.drivers.[0].vehicle`). */
  resources: Record<string, CurrentResource>;
  /** The settled instances' states, as dynz resolves `resourceRef`s against them. */
  resourceStates: ResourceStates;
};

/**
 * Provided by `DynzFormProvider`, next to react-hook-form's own context (which only carries
 * react-hook-form's methods). A form without resources has none.
 */
export const DynzResourcesContext = createContext<DynzFormResources>({ resources: {}, resourceStates: {} });

export function useDynzFormContext<T extends ObjectSchema<never>, TFieldValues extends FieldValues>() {
  const context = useFormContext<
    TFieldValues,
    { schema: T; dependencies: RulesDependencyMap; name?: string | undefined },
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

  const { resources, resourceStates } = useContext(DynzResourcesContext);

  return {
    ...context,
    resources,
    resourceStates,
    schema: schema,
    name: context.control._options.context?.name,
    getDependencies: getDependencies,
  };
}
