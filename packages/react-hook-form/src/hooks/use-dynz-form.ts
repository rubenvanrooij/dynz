import {
  getRulesDependenciesMap,
  type ObjectSchema,
  type RulesDependencyMap,
  type SchemaValues,
  type ValidateOptions,
} from "dynz";
import { type FieldValues, type UseFormProps, type UseFormReturn, useForm } from "react-hook-form";
import { dynzResolver, type MessageTransformerFunc } from "../resolver";

export type UseDynzFormProps<TSchema extends ObjectSchema<never>, TFieldValues extends FieldValues = FieldValues> = {
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
      schema: TSchema;
      dependencies: RulesDependencyMap;
    },
    SchemaValues<TSchema>
  >,
  "resolver"
>;

export type UseDynzFormReturn<TSchema extends ObjectSchema<never>, TFieldValues extends FieldValues = FieldValues> = {
  schema: TSchema;
} & UseFormReturn<
  TFieldValues,
  {
    schema: TSchema;
    dependencies: RulesDependencyMap;
  },
  SchemaValues<TSchema>
>;

export function useDynzForm<TSchema extends ObjectSchema<never>, TFieldValues extends FieldValues = FieldValues>({
  schema,
  currentValues,
  schemaOptions,
  resolverOptions,
  ...props
}: UseDynzFormProps<TSchema, TFieldValues>): UseDynzFormReturn<TSchema, TFieldValues> {
  const methods = useForm({
    ...props,
    resolver: dynzResolver(schema, currentValues, schemaOptions, resolverOptions),
    context: {
      schema,
      dependencies: getRulesDependenciesMap(schema, "$"),
    },
  });

  return {
    ...methods,
    schema,
  };
}
