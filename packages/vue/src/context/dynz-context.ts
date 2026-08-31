import { getRulesDependenciesMap, type ObjectSchema, type RulesDependencyMap } from "dynz";
import { type InjectionKey, inject, provide } from "vue";
import { toFieldName } from "../utils";

/**
 * Everything the condition composables (`useIsRequired`, `useIsIncluded`,
 * `useIsMutable`, `usePredicate`, `useOptions`) need in order to resolve a schema
 * against the live form values.
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
   * exact shape differs per host (a `reactive()` object here, VeeValidate's partial
   * `values` there).
   */
  getValues: () => unknown;

  /** Field names that must be re-validated when `name` changes. */
  getDependencies: (name: string) => string[] | undefined;

  /**
   * Per-field state. Supplied by `useDynzForm`; absent when only a bare context is
   * provided (for instance when VeeValidate owns the form state). `useDynzField` and
   * `DynzField` require it, the condition composables do not.
   */
  field?: DynzFieldAdapter | undefined;
};

/** The form-state seam `useDynzField` binds to. */
export type DynzFieldAdapter = {
  getValue: (name: string) => unknown;
  setValue: (name: string, value: unknown) => void;
  getError: (name: string) => string | undefined;
  isTouched: (name: string) => boolean;
  setTouched: (name: string, touched: boolean) => void;
  /** Called after a value change; decides for itself whether to validate. */
  handleInput: (name: string) => void;
  /** Called on blur; marks the field touched and decides whether to validate. */
  handleBlur: (name: string) => void;
};

export const DYNZ_INJECTION_KEY: InjectionKey<DynzContext> = Symbol("dynz");

export type CreateDynzContextOptions<TSchema extends ObjectSchema<never>> = {
  schema: TSchema;
  getValues: () => unknown;
  name?: string | undefined;
  /** Pre-computed dependency map; computed lazily from the schema when omitted. */
  dependencies?: RulesDependencyMap | undefined;
  field?: DynzFieldAdapter | undefined;
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
  field,
}: CreateDynzContextOptions<TSchema>): DynzContext<TSchema> {
  return {
    schema,
    name,
    getValues,
    getDependencies: createDependencyResolver(schema, dependencies),
    field,
  };
}

/**
 * Creates a {@link DynzContext} and makes it available to every descendant
 * component. Use this when another library (e.g. VeeValidate) owns the form state
 * but you still want the dynz condition composables:
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

/** A {@link DynzContext} that is known to manage per-field state. */
export type DynzFieldContext<TSchema extends ObjectSchema<never> = ObjectSchema<never>> = Omit<
  DynzContext<TSchema>,
  "field"
> & {
  field: DynzFieldAdapter;
};

/**
 * Same as {@link useDynzFormContext} but additionally asserts that per-field state
 * is available.
 */
export function useDynzFieldAdapter<
  TSchema extends ObjectSchema<never> = ObjectSchema<never>,
>(): DynzFieldContext<TSchema> {
  const context = useDynzFormContext<TSchema>();

  if (context.field === undefined) {
    throw new Error(
      "The dynz context does not manage field state. Use useDynzForm, or pass a field adapter to provideDynzContext."
    );
  }

  return context as DynzFieldContext<TSchema>;
}
