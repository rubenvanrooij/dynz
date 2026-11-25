import { createResourceCache } from "@dynz/form-resources";
import {
  getRulesDependenciesMap,
  type ObjectSchema,
  type ResourceResolvers,
  type RulesDependencyMap,
  type SchemaValues,
  type ValidateOptions,
} from "dynz";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type FieldValues, type UseFormProps, type UseFormReturn, useForm } from "react-hook-form";
import { dynzResolver, type MessageTransformerFunc } from "../resolver";
import type { DynzFormResources } from "./use-dynz-form-context";
import { useResourceRevalidation } from "./use-resource-revalidation";

// `useLayoutEffect` warns when rendered on the server; nothing to lay out there
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type UseDynzFormProps<TSchema extends ObjectSchema<never>, TFieldValues extends FieldValues = FieldValues> = {
  name?: string;
  schema: TSchema;
  currentValues?: SchemaValues<TSchema>;
  /** Forwarded to dynz' `validate` (custom rules, stripping excluded values, …). */
  schemaOptions?: Omit<ValidateOptions, "resolvers">;
  /**
   * How to look up each resource, by resource name: the same resolvers `validate` takes on the
   * server. The form looks up every enabled instance as the values change, once per key, and
   * its conditions, its UI (`useResources`) and its validation all read those results.
   * Validation waits for a lookup that is still running.
   *
   * Return an expected failure (a service that is down) as one of the resource's outcomes, so
   * the schema handles it. A resolver that throws is unexpected: its instance is `failed`,
   * logged with `console.error`, until it is retried, and validation has no state for it
   * meanwhile. Without this prop the form ignores resources: every `resourceRef` resolves to
   * `undefined`.
   *
   * @example
   * ```ts
   * useDynzForm({
   *   schema,
   *   resolvers: {
   *     vehicle: async (plate, { signal }) => (await fetch(`/api/vehicles/${plate}`, { signal })).json(),
   *   },
   * });
   * ```
   */
  resolvers?: ResourceResolvers | undefined;
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
} & DynzFormResources &
  UseFormReturn<
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
  resolvers,
  resolverOptions,
  ...props
}: UseDynzFormProps<TSchema, TFieldValues>): UseDynzFormReturn<TSchema, TFieldValues> {
  // read on every lookup, so resolvers written inline (a new object each render) work
  const latest = useRef(resolvers);
  latest.current = resolvers;
  const [cache] = useState(() => createResourceCache(schema, () => latest.current ?? {}));
  // as React state, so every hook reading them (through `DynzFormProvider`) re-renders
  const [current, setCurrent] = useState(cache.current);
  const enabled = resolvers !== undefined;

  const methods = useForm({
    ...props,
    resolver: dynzResolver(
      schema,
      currentValues,
      // validation reads the form's lookups, and waits for running ones
      enabled ? { ...schemaOptions, resolvers: cache.resolvers } : schemaOptions,
      resolverOptions
    ),
    context: {
      schema,
      name,
      dependencies: getRulesDependenciesMap(schema, "$"),
    },
  });

  const { watch, getValues } = methods;

  // before paint, so the hooks never show the previous values' resources
  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    // the cache keeps its snapshot while nothing changed, so this only re-renders on a change
    const stopListening = cache.subscribe(() => setCurrent(cache.current()));
    const { unsubscribe } = watch(() => cache.update(getValues()));
    cache.update(getValues());

    return () => {
      stopListening();
      unsubscribe();
      cache.dispose();
    };
  }, [cache, enabled, watch, getValues]);

  useResourceRevalidation(methods, schema, current.states);

  return {
    ...methods,
    name,
    schema,
    resources: current.instances,
  };
}
