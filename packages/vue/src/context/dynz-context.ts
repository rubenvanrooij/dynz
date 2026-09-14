import { getRulesDependenciesMap, type ObjectSchema, type RulesDependencyMap } from "dynz";
import { type InjectionKey, inject, provide } from "vue";
import { toFieldName } from "../utils";

/** When a field triggers validation. Mirrors React Hook Form's modes. */
export type DynzFormMode = "onInput" | "onBlur" | "onSubmit";

/**
 * Everything the condition composables (`useIsRequired`, `useIsIncluded`,
 * `useIsMutable`, `usePredicate`, `useOptions`) need in order to resolve a schema
 * against the live form values. `useDynzField` additionally relies on `mode` /
 * `revalidateMode` / `isSubmitted` to decide when to trigger vee-validate's own
 * field validation.
 */
export type DynzContext<TSchema extends ObjectSchema<never> = ObjectSchema<never>> = {
  /** The schema the form was built from. */
  schema: TSchema;

  /** Optional name of the form, mirrors `@dynz/react-hook-form`. */
  name?: string | undefined;

  /**
   * Must return the *reactive* values object — not a clone. Vue tracks the property
   * reads that `resolveProperty`/`resolvePredicate` perform, which is what keeps the
   * condition composables in sync without any manual dependency wiring.
   *
   * Typed as `unknown` on purpose: dynz resolves against `unknown` values too, and the
   * exact shape differs per host (VeeValidate's `values` here, a plain object there).
   */
  getValues: () => unknown;

  /** Field names that must be re-validated when `name` changes. */
  getDependencies: (name: string) => string[] | undefined;

  /**
   * When a field triggers vee-validate validation before the form's first submit.
   * Only set by `useDynzForm`; `useDynzField` falls back to `"onSubmit"` when absent.
   */
  mode?: DynzFormMode | undefined;

  /**
   * When a field triggers vee-validate validation after the form's first submit.
   * Only set by `useDynzForm`; `useDynzField` falls back to `"onInput"` when absent.
   */
  revalidateMode?: DynzFormMode | undefined;

  /** Whether the form has been submitted at least once. Only set by `useDynzForm`. */
  isSubmitted?: (() => boolean) | undefined;
};

export const DYNZ_INJECTION_KEY: InjectionKey<DynzContext> = Symbol("dynz");

export type CreateDynzContextOptions<TSchema extends ObjectSchema<never>> = {
  schema: TSchema;
  getValues: () => unknown;
  name?: string | undefined;
  /** Pre-computed dependency map; computed lazily from the schema when omitted. */
  dependencies?: RulesDependencyMap | undefined;
  mode?: DynzFormMode | undefined;
  revalidateMode?: DynzFormMode | undefined;
  isSubmitted?: (() => boolean) | undefined;
};

/**
 * Builds the reverse lookup "which fields must be re-validated when `name` changes",
 * translating dynz' absolute paths into field names. The dependency map is computed
 * on first use, since a form that never validates a single field never needs it.
 */
export function createDependencyResolver(
  schema: ObjectSchema<never>,
  dependencies?: RulesDependencyMap
): (name: string) => string[] | undefined {
  let dependencyMap = dependencies;

  return (name: string) => {
    dependencyMap ??= getRulesDependenciesMap(schema, "$");

    const dependents = dependencyMap.reverse[`$.${name}`];

    return dependents ? [...dependents].map(toFieldName) : undefined;
  };
}

/**
 * Builds a {@link DynzContext} without providing it, so the caller decides where it
 * gets injected (a component, an app-level `provide`, or a test harness).
 */
export function createDynzContext<TSchema extends ObjectSchema<never>>({
  schema,
  getValues,
  name,
  dependencies,
  mode,
  revalidateMode,
  isSubmitted,
}: CreateDynzContextOptions<TSchema>): DynzContext<TSchema> {
  return {
    schema,
    name,
    getValues,
    getDependencies: createDependencyResolver(schema, dependencies),
    mode,
    revalidateMode,
    isSubmitted,
  };
}

/**
 * Creates a {@link DynzContext} and makes it available to every descendant
 * component. Use this when vee-validate owns the form state but you still want the
 * dynz condition composables:
 *
 * ```ts
 * const { values } = useForm({ validationSchema: dynzTypedSchema(schema) });
 * provideDynzContext({ schema, getValues: () => values });
 * ```
 */
export function provideDynzContext<TSchema extends ObjectSchema<never>>(
  options: CreateDynzContextOptions<TSchema>
): DynzContext<TSchema> {
  const context = createDynzContext(options);

  provide(DYNZ_INJECTION_KEY, context as unknown as DynzContext);

  return context;
}

/**
 * Reads the dynz context provided by `useDynzForm` or `provideDynzContext`.
 *
 * @throws when no dynz context is available in the component tree.
 */
export function useDynzFormContext<TSchema extends ObjectSchema<never> = ObjectSchema<never>>(): DynzContext<TSchema> {
  const context = inject(DYNZ_INJECTION_KEY, null);

  if (context === null) {
    throw new Error("No dynz context found. Are you sure you setup your form with useDynzForm or provideDynzContext?");
  }

  return context as unknown as DynzContext<TSchema>;
}
