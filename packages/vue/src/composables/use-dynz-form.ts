import { type ObjectSchema, type SchemaInput, type SchemaValues, toFormValues, type ValidateOptions } from "dynz";
import { type FormContext, type TypedSchema, useForm } from "vee-validate";
import { getCurrentInstance, provide } from "vue";
import { createDependencyResolver, DYNZ_INJECTION_KEY, type DynzContext, type DynzFormMode } from "../context";
import type { MessageTransformerFunc } from "../errors";
import { dynzTypedSchema } from "../typed-schema";
import type { DynzFormValues, DynzPartialFormValues } from "../types";
import { getByPath } from "../utils";

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
  currentValues?: SchemaInput<TSchema> | undefined;

  /** Forwarded to dynz' `validate` (custom rules, stripping excluded values, …). */
  schemaOptions?: ValidateOptions | undefined;

  /** Rewrites dynz error messages, for instance to run them through i18n. */
  messageTransformer?: MessageTransformerFunc | undefined;

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
    mode = "onSubmit",
    revalidateMode = "onInput",
    provideContext = true,
  } = options;

  // Declared ahead of `useForm` (rather than `const form = useForm(...)`) so the
  // `getValues` closure below can reference `form` without TypeScript treating the
  // whole expression as self-referential; it is never *invoked* until validation
  // runs, well after `form` is assigned.
  let form: FormContext<DynzFormValues<TSchema>, SchemaValues<TSchema>>;

  // `dynzTypedSchema` is typed against dynz's own (readonly) `SchemaValues`, and
  // `initialValues` may be a `DynzPartialFormValues`/`SchemaValues` mix — neither lines
  // up structurally with vee-validate's generic `PartialDeep`/`TypedSchema` machinery,
  // so the boundary is asserted here rather than fought with casts on every call site.
  form = useForm<DynzFormValues<TSchema>, SchemaValues<TSchema>>({
    ...(name !== undefined ? { name } : {}),
    // Inputs bind to raw values: masked private fields show their mask string.
    initialValues: toFormValues(schema, options.initialValues ?? currentValues) as never,
    validationSchema: dynzTypedSchema(schema, currentValues, schemaOptions, {
      messageTransformer,
      getValues: () => form.values as unknown as Partial<SchemaValues<TSchema>>,
    }) as unknown as TypedSchema<DynzFormValues<TSchema>, SchemaValues<TSchema>>,
  });

  const getDependencies = createDependencyResolver(schema);

  const context: DynzContext<TSchema> = {
    schema,
    name,
    getValues: () => form.values,
    getDependencies,
    mode,
    revalidateMode,
    isSubmitted: () => form.submitCount.value > 0,
  };

  if (provideContext && getCurrentInstance() !== null) {
    provide(DYNZ_INJECTION_KEY, context as unknown as DynzContext);
  }

  function getValue<TValue = unknown>(fieldName: string): TValue | undefined {
    return getByPath<TValue>(form.values, fieldName);
  }

  return { ...form, schema, getValue, getDependencies, context };
}
