import {
  type EnabledResource,
  getEnabledResources,
  getRulesDependenciesMap,
  type ObjectSchema,
  type RulesDependencyMap,
  type SchemaValues,
  type ValidateOptions,
} from "dynz";
import { useEffect, useState } from "react";
import { type FieldValues, type UseFormProps, type UseFormReturn, useForm } from "react-hook-form";
import { dynzResolver, type MessageTransformerFunc } from "../resolver";
import { createResourceStore, type ResourceEntry, type ResourceStore } from "./resource-store";

export type UseDynzFormProps<TSchema extends ObjectSchema<never>, TFieldValues extends FieldValues = FieldValues> = {
  name?: string;
  schema: TSchema;
  currentValues?: SchemaValues<TSchema>;
  schemaOptions?: ValidateOptions;
  resolverOptions?: {
    messageTransformer?: MessageTransformerFunc;
    mode?: "async" | "sync";
    raw?: boolean;
  };
} & Omit<
  UseFormProps<
    TFieldValues,
    {
      name?: string | undefined;
      schema: TSchema;
      dependencies: RulesDependencyMap;
      resources: ResourceStore;
    },
    SchemaValues<TSchema>
  >,
  "resolver"
>;

export type UseDynzFormReturn<TSchema extends ObjectSchema<never>, TFieldValues extends FieldValues = FieldValues> = {
  schema: TSchema;
  name?: string | undefined;
} & UseFormReturn<
  TFieldValues,
  {
    name?: string | undefined;
    schema: TSchema;
    dependencies: RulesDependencyMap;
    resources: ResourceStore;
  },
  SchemaValues<TSchema>
>;

export function useDynzForm<TSchema extends ObjectSchema<never>, TFieldValues extends FieldValues = FieldValues>({
  schema,
  name,
  currentValues,
  schemaOptions,
  resolverOptions,
  ...props
}: UseDynzFormProps<TSchema, TFieldValues>): UseDynzFormReturn<TSchema, TFieldValues> {
  const [resources] = useState(createResourceStore);

  const methods = useForm({
    ...props,
    resolver: dynzResolver(schema, currentValues, schemaOptions, resolverOptions),
    context: {
      schema,
      name,
      dependencies: getRulesDependenciesMap(schema, "$"),
      resources,
    },
  });

  const resolvers = schemaOptions?.resolvers;
  const { watch, getValues } = methods;

  // Re-evaluates which resources are enabled on every change and looks up the instances
  // whose key changed (or that failed); caching lookups is up to the resolvers.
  // Keep `resolvers` stable: a new object re-subscribes and re-evaluates.
  useEffect(() => {
    if (resolvers === undefined) {
      return;
    }

    const lookup = (instance: EnabledResource) => {
      const settle = (entry: ResourceEntry) => {
        // a result for a key the instance no longer has is stale
        if (resources.getEntries()[instance.path]?.key === instance.key) {
          resources.set({ ...resources.getEntries(), [instance.path]: entry });
        }
      };

      Promise.resolve()
        .then(() => {
          const resolver = resolvers[instance.name];

          if (resolver === undefined) {
            throw new Error(`No resolver for resource "${instance.name}" at ${instance.path}`);
          }

          return resolver(instance.key, instance);
        })
        .then(
          (state) => settle({ status: "settled", key: instance.key, state }),
          (error: unknown) => settle({ status: "failed", key: instance.key, error })
        );
    };

    const evaluate = (values: unknown) => {
      const current = resources.getEntries();
      const instances = getEnabledResources(schema, values);
      const next = Object.fromEntries(
        instances.map(({ path, key }) => {
          const entry = current[path];
          const keep = entry !== undefined && entry.key === key && entry.status !== "failed";
          return [path, keep ? entry : ({ status: "pending", key } as const)];
        })
      );
      const changed = instances.filter(({ path }) => next[path] !== current[path]);

      if (changed.length > 0 || Object.keys(next).length !== Object.keys(current).length) {
        resources.set(next);
      }

      changed.forEach(lookup);
    };

    evaluate(getValues());
    const { unsubscribe } = watch((values) => evaluate(values));

    return unsubscribe;
  }, [schema, resolvers, resources, watch, getValues]);

  return {
    ...methods,
    name,
    schema,
  };
}
