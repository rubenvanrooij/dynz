import {
  getRulesDependenciesMap,
  type ObjectSchema,
  type RulesDependencyMap,
  type SchemaInput,
  type SchemaValues,
  toFormValues,
  type ValidateOptions,
} from "dynz";
import { type FieldValues, type UseFormProps, type UseFormReturn, useForm } from "react-hook-form";
import { dynzResolver, type MessageTransformerFunc } from "../resolver";

export type UseDynzFormProps<TSchema extends ObjectSchema<never>, TFieldValues extends FieldValues = FieldValues> = {
  name?: string;
  schema: TSchema;
  /**
   * The values the form was loaded with, typically the server's `maskPrivateValues`
   * payload. Used for mutability checks and to tell untouched private fields apart.
   */
  currentValues?: SchemaInput<TSchema>;
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
  // Inputs bind to raw values: masked private fields show their mask string.
  const defaultValues =
    typeof props.defaultValues === "function"
      ? props.defaultValues
      : (toFormValues(schema, props.defaultValues ?? currentValues) as typeof props.defaultValues);

  const methods = useForm({
    ...props,
    ...(defaultValues !== undefined ? { defaultValues } : {}),
    resolver: dynzResolver(schema, currentValues, schemaOptions, resolverOptions),
    context: {
      schema,
      name,
      dependencies: getRulesDependenciesMap(schema, "$"),
    },
  });

  return {
    ...methods,
    name,
    schema,
  };
}
