import { createResourceCache } from "@dynz/form-resources";
import type { ObjectSchema, ResourceResolvers, SchemaValues, ValidateOptions } from "dynz";
import { type FormContext, type TypedSchema, useForm } from "vee-validate";
import { computed, getCurrentInstance, onScopeDispose, provide, shallowRef, watch } from "vue";
import { createDependencyResolver, DYNZ_INJECTION_KEY, type DynzContext, type DynzFormMode } from "../context";
import type { MessageTransformerFunc } from "../errors";
import { dynzTypedSchema, type ValidationResultTransformer } from "../typed-schema";
import type { DynzFormValues, DynzPartialFormValues } from "../types";
import { getByPath } from "../utils";
import { useResourceRevalidation } from "./use-resource-revalidation";

export type { DynzFormMode } from "../context";

export type UseDynzFormOptions<TSchema extends ObjectSchema<never>> = {
  /** The dynz schema describing the form. */
  schema: TSchema;

  /** Optional name of the form, exposed on the context. */
  name?: string | undefined;

  /** Values the form starts with. Defaults to `currentValues` when omitted. */
  initialValues?: DynzPartialFormValues<TSchema> | undefined;

  /**
   * The persisted values. Passing these turns on mutability enforcement: fields whose
   * `mutable` resolves to `false` may not deviate from the value stored here.
   */
  currentValues?: SchemaValues<TSchema> | undefined;

  /** Forwarded to dynz' `validate` (custom rules, stripping excluded values, …). */
  schemaOptions?: Omit<ValidateOptions, "resolvers"> | undefined;

  /**
   * How to look up each resource, by resource name: the same resolvers `validate` takes on the
   * server. The form looks up every enabled instance as the values change, once per key, and
   * its conditions, its UI (`useResources`) and its validation all read those results.
   * Validation waits for a lookup that is still running.
   *
   * A resolver that throws leaves its instance `failed`, logged with `console.error`, until it
   * is retried; validation gets no state for it meanwhile. Rather return a fallback outcome the
   * schema handles. Without this option the form ignores resources: every `resourceRef`
   * resolves to `undefined`.
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

  /** Rewrites dynz error messages, for instance to run them through i18n. */
  messageTransformer?: MessageTransformerFunc | undefined;

  /**
   * Alters the dynz validation result before it becomes field errors, e.g. to filter
   * out errors for certain paths. Runs before `messageTransformer`.
   *
   * @example
   * ```ts
   * transformResult: (result) =>
   *   result.success
   *     ? result
   *     : { ...result, errors: result.errors.filter((error) => !error.path.startsWith("$.billing")) },
   * ```
   */
  transformResult?: ValidationResultTransformer<TSchema> | undefined;

  /** When to validate before the first submit. Defaults to `"onSubmit"`. */
  mode?: DynzFormMode | undefined;

  /** When to validate after the first submit. Defaults to `"onInput"`. */
  revalidateMode?: DynzFormMode | undefined;

  /**
   * Whether to `provide` the context to descendant components. Defaults to `true`.
   * Set to `false` to wire the returned `context` up yourself.
   */
  provideContext?: boolean | undefined;
};

export type UseDynzFormReturn<TSchema extends ObjectSchema<never>> = FormContext<
  DynzFormValues<TSchema>,
  SchemaValues<TSchema>
> & {
  schema: TSchema;

  /**
   * Reads a value by field name. vee-validate's `FormContext` has no generic getter
   * (only the `useFieldValue()` composable, which can't be called outside `setup()`).
   */
  getValue: <TValue = unknown>(name: string) => TValue | undefined;

  /** Field names that must be re-validated when `name` changes. */
  getDependencies: (name: string) => string[] | undefined;

  /** The context that is (optionally) provided to descendants. */
  context: DynzContext<TSchema>;
};

/**
 * A dynz form backed by vee-validate: `useDynzForm` is a thin wrapper around
 * vee-validate's own `useForm`, using `dynzTypedSchema` as the validation schema.
 *
 * The condition composables (`useIsRequired`, `useIsIncluded`, `useIsMutable`,
 * `useOptions`, `usePredicate`) stay in sync automatically off vee-validate's own
 * reactive `values` — Vue tracks the reads that dynz performs while resolving a
 * condition.
 *
 * @example
 * ```ts
 * const schema = object({
 *   plan: options(["free", "enterprise"] as const),
 *   companyName: string().min(1).setIncluded(eq(ref("plan"), "enterprise")),
 * });
 *
 * const { values, errors, handleSubmit } = useDynzForm({ schema, mode: "onBlur" });
 * ```
 */
export function useDynzForm<TSchema extends ObjectSchema<never>>(
  options: UseDynzFormOptions<TSchema>
): UseDynzFormReturn<TSchema> {
  const {
    schema,
    name,
    currentValues,
    schemaOptions,
    messageTransformer,
    transformResult,
    mode = "onSubmit",
    revalidateMode = "onInput",
    provideContext = true,
  } = options;

  // Declared ahead of `useForm` (rather than `const form = useForm(...)`) so the
  // `getValues` closure below can reference `form` without TypeScript treating the
  // whole expression as self-referential; it is never *invoked* until validation
  // runs, well after `form` is assigned.
  let form: FormContext<DynzFormValues<TSchema>, SchemaValues<TSchema>>;
  const cache = createResourceCache(schema, options.resolvers ?? {});
  const resources = shallowRef(cache.current());

  // `dynzTypedSchema` is typed against dynz's own (readonly) `SchemaValues`, and
  // `initialValues` may be a `DynzPartialFormValues`/`SchemaValues` mix — neither lines
  // up structurally with vee-validate's generic `PartialDeep`/`TypedSchema` machinery,
  // so the boundary is asserted here rather than fought with casts on every call site.
  form = useForm<DynzFormValues<TSchema>, SchemaValues<TSchema>>({
    ...(name !== undefined ? { name } : {}),
    initialValues: (options.initialValues ?? currentValues) as never,
    validationSchema: dynzTypedSchema(
      schema,
      currentValues,
      // validation reads the form's lookups, and waits for running ones
      options.resolvers === undefined ? schemaOptions : { ...schemaOptions, resolvers: cache.resolvers },
      {
        messageTransformer,
        transformResult,
        getValues: () => form.values as unknown as Partial<SchemaValues<TSchema>>,
        getResources: () => resources.value.states,
      }
    ) as unknown as TypedSchema<DynzFormValues<TSchema>, SchemaValues<TSchema>>,
  });

  if (options.resolvers !== undefined) {
    cache.subscribe(() => {
      resources.value = cache.current();
    });
    // synchronously, so the composables never read the previous values' resources
    watch(
      () => form.values,
      (values) => cache.update(values),
      { deep: true, immediate: true, flush: "sync" }
    );
    onScopeDispose(() => cache.dispose());
  }

  const states = computed(() => resources.value.states);
  useResourceRevalidation(form, schema, states);

  const getDependencies = createDependencyResolver(schema);

  const context: DynzContext<TSchema> = {
    schema,
    name,
    getValues: () => form.values,
    getDependencies,
    mode,
    revalidateMode,
    isSubmitted: () => form.submitCount.value > 0,
    getResources: () => states.value,
    getResourceInstances: () => resources.value.instances,
  };

  if (provideContext && getCurrentInstance() !== null) {
    provide(DYNZ_INJECTION_KEY, context as unknown as DynzContext);
  }

  function getValue<TValue = unknown>(fieldName: string): TValue | undefined {
    return getByPath<TValue>(form.values, fieldName);
  }

  return { ...form, schema, getValue, getDependencies, context };
}
