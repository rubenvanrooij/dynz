import {
  getRulesDependenciesMap,
  type ObjectSchema,
  type RulesDependencyMap,
  type SchemaValues,
  type ValidateOptions,
} from "dynz";
import { useState } from "react";
import { type FieldValues, type UseFormProps, type UseFormReturn, useForm } from "react-hook-form";
import { dynzResolver, type MessageTransformerFunc } from "../resolver";
import { createResourceStore, type ResourceStore } from "./resource-store";
import { useResourceLookups } from "./use-resource-lookups";
import { useResourceRevalidation } from "./use-resource-revalidation";

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

  useResourceLookups(methods, schema, resources, schemaOptions?.resolvers);
  useResourceRevalidation(methods, schema, resources);

  return {
    ...methods,
    name,
    schema,
  };
}
