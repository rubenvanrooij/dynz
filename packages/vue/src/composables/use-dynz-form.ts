import {
  type ErrorMessage,
  type ObjectSchema,
  type SchemaValues,
  type ValidateOptions,
  type ValidationResult,
  validate,
} from "dynz";
import { type ComputedRef, type Ref, computed, getCurrentInstance, provide, reactive, ref, toRaw } from "vue";
import { DYNZ_INJECTION_KEY, type DynzContext, type DynzFieldAdapter, createDependencyResolver } from "../context";
import { type MessageTransformerFunc, toFieldErrors } from "../errors";
import type { DynzFormValues, DynzPartialFormValues } from "../types";
import { cloneValues, getByPath, isPathWithin, normalizeDependencyName, setByPath, toFieldName } from "../utils";

/** When a field triggers validation. Mirrors React Hook Form's modes. */
export type DynzFormMode = "onInput" | "onBlur" | "onSubmit";

export type UseDynzFormOptions<TSchema extends ObjectSchema<never>> = {
  /** The dynz schema describing the form. */
  schema: TSchema;

  /** Optional name of the form, exposed on the context. */
  name?: string | undefined;

  /**
   * Values the form starts with. Deep cloned, so the object passed in is never
   * mutated. Defaults to `currentValues` when omitted.
   */
  initialValues?: DynzPartialFormValues<TSchema> | undefined;

  /**
   * The persisted values. Passing these turns on mutability enforcement: fields whose
   * `mutable` resolves to `false` may not deviate from the value stored here.
   */
  currentValues?: SchemaValues<TSchema> | undefined;

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

export type UseDynzFormReturn<TSchema extends ObjectSchema<never>> = {
  schema: TSchema;
  name: string | undefined;

  /** The reactive form values. Mutate directly or through `setValue`. */
  values: DynzFormValues<TSchema>;

  /** First error message per field name, keyed without the `$.` prefix. */
  errors: Ref<Record<string, string>>;

  /** The unmapped dynz errors of the last validation run. */
  rawErrors: Ref<ErrorMessage[]>;

  /** Fields that have been blurred at least once. */
  touched: Ref<Record<string, boolean>>;

  isSubmitting: Ref<boolean>;
  isSubmitted: Ref<boolean>;
  submitCount: Ref<number>;

  /** Whether the last validation run produced no errors. `true` before the first run. */
  isValid: ComputedRef<boolean>;

  /** Validates the whole form and refreshes `errors`. */
  validate: () => Promise<ValidationResult<SchemaValues<TSchema>>>;

  /**
   * Validates the whole form but only refreshes the errors of `name`, its children
   * and the fields whose rules depend on it.
   */
  validateField: (name: string) => Promise<void>;

  getValue: <TValue = unknown>(name: string) => TValue | undefined;
  setValue: (name: string, value: unknown) => void;
  setTouched: (name: string, touched?: boolean) => void;

  /** Sets an error manually, e.g. after a server-side validation round trip. */
  setError: (name: string, message: string | undefined) => void;
  clearErrors: () => void;

  /** Restores the form to `values`, or to the initial values when omitted. */
  reset: (values?: DynzPartialFormValues<TSchema>) => void;

  /** Wraps a submit handler: validates first, then calls `onValid` or `onInvalid`. */
  handleSubmit: (
    onValid: (values: SchemaValues<TSchema>) => unknown,
    onInvalid?: (errors: ErrorMessage[]) => unknown
  ) => (event?: Event) => Promise<void>;

  /** Field names that must be re-validated when `name` changes. */
  getDependencies: (name: string) => string[] | undefined;

  /** The context that is (optionally) provided to descendants. */
  context: DynzContext<TSchema>;
};

/**
 * Standalone dynz form: reactive values, validation and per-field state, with no
 * form-library dependency.
 *
 * The values object is deeply reactive, so the condition composables
 * (`useIsRequired`, `useIsIncluded`, `useIsMutable`, `useOptions`, `usePredicate`)
 * stay in sync automatically — Vue tracks the reads that dynz performs while
 * resolving a condition.
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

  const initialValues = options.initialValues ?? currentValues ?? {};

  const values = reactive(cloneValues(initialValues) as Record<string, unknown>) as DynzFormValues<TSchema>;
  const errors = ref<Record<string, string>>({});
  const rawErrors = ref<ErrorMessage[]>([]);
  const touched = ref<Record<string, boolean>>({});
  const isSubmitting = ref(false);
  const isSubmitted = ref(false);
  const submitCount = ref(0);

  const getDependencies = createDependencyResolver(schema);

  const isValid = computed(() => Object.keys(errors.value).length === 0);

  function runValidate(): Promise<ValidationResult<SchemaValues<TSchema>>> {
    // toRaw keeps the reactivity system out of the (async) validation run; the raw
    // target holds the raw children too, since reactive() wraps nested values lazily.
    return validate(schema, currentValues, toRaw(values), schemaOptions);
  }

  async function validateForm(): Promise<ValidationResult<SchemaValues<TSchema>>> {
    const result = await runValidate();

    if (result.success) {
      errors.value = {};
      rawErrors.value = [];
    } else {
      errors.value = toFieldErrors(result.errors, messageTransformer);
      rawErrors.value = result.errors;
    }

    return result;
  }

  /**
   * dynz always validates the document as a whole, so the scoping happens afterwards:
   *
   * - errors on `fieldName` (and anything nested under it, or declared dependent on it)
   *   are refreshed — typing in a field is allowed to surface its own problems;
   * - errors that already existed elsewhere are dropped as soon as they are resolved,
   *   which is what makes a cross-field rule such as `equals(ref("password"))` heal
   *   itself even without the dependency map;
   * - fields the user has not touched never gain a *new* error from someone else's
   *   keystroke.
   */
  async function validateField(fieldName: string): Promise<void> {
    const scopes = [fieldName, ...(getDependencies(fieldName) ?? [])].map(normalizeDependencyName);
    const isInScope = (path: string) => scopes.some((scope) => isPathWithin(path, scope));

    const result = await runValidate();
    const nextRaw = result.success ? [] : result.errors;
    const nextErrors = toFieldErrors(nextRaw, messageTransformer);

    const merged: Record<string, string> = {};

    for (const path of Object.keys(errors.value)) {
      if (nextErrors[path] !== undefined) {
        merged[path] = nextErrors[path];
      }
    }

    for (const [path, message] of Object.entries(nextErrors)) {
      if (isInScope(path)) {
        merged[path] = message;
      }
    }

    errors.value = merged;
    rawErrors.value = nextRaw.filter((error) => merged[toFieldName(error.path)] !== undefined);
  }

  function getValue<TValue = unknown>(fieldName: string): TValue | undefined {
    return getByPath<TValue>(values, fieldName);
  }

  function setValue(fieldName: string, value: unknown): void {
    setByPath(values as Record<string, unknown>, fieldName, value);
  }

  function setTouched(fieldName: string, isTouched = true): void {
    touched.value = { ...touched.value, [fieldName]: isTouched };
  }

  function setError(fieldName: string, message: string | undefined): void {
    const next = { ...errors.value };

    if (message === undefined) {
      delete next[fieldName];
    } else {
      next[fieldName] = message;
    }

    errors.value = next;
  }

  function clearErrors(): void {
    errors.value = {};
    rawErrors.value = [];
  }

  function reset(nextValues?: DynzPartialFormValues<TSchema>): void {
    const target = values as Record<string, unknown>;
    const next = cloneValues(nextValues ?? initialValues) as Record<string, unknown>;

    for (const key of Object.keys(target)) {
      if (!(key in next)) {
        delete target[key];
      }
    }

    Object.assign(target, next);

    clearErrors();
    touched.value = {};
    isSubmitted.value = false;
    submitCount.value = 0;
  }

  function shouldValidateOn(event: Exclude<DynzFormMode, "onSubmit">): boolean {
    return (isSubmitted.value ? revalidateMode : mode) === event;
  }

  function handleSubmit(
    onValid: (submitted: SchemaValues<TSchema>) => unknown,
    onInvalid?: (submitErrors: ErrorMessage[]) => unknown
  ) {
    return async (event?: Event): Promise<void> => {
      event?.preventDefault();

      isSubmitting.value = true;
      submitCount.value += 1;

      try {
        const result = await validateForm();

        isSubmitted.value = true;

        if (result.success) {
          await onValid(result.values);
        } else {
          await onInvalid?.(result.errors);
        }
      } finally {
        isSubmitting.value = false;
      }
    };
  }

  const field: DynzFieldAdapter = {
    getValue: (fieldName) => getByPath(values, fieldName),
    setValue,
    getError: (fieldName) => errors.value[fieldName],
    isTouched: (fieldName) => touched.value[fieldName] === true,
    setTouched: (fieldName, isTouched) => setTouched(fieldName, isTouched),
    handleInput: (fieldName) => {
      if (shouldValidateOn("onInput")) {
        void validateField(fieldName);
      }
    },
    handleBlur: (fieldName) => {
      setTouched(fieldName, true);

      if (shouldValidateOn("onBlur")) {
        void validateField(fieldName);
      }
    },
  };

  const context: DynzContext<TSchema> = {
    schema,
    name,
    getValues: () => values,
    getDependencies,
    field,
  };

  if (provideContext && getCurrentInstance() !== null) {
    provide(DYNZ_INJECTION_KEY, context as unknown as DynzContext);
  }

  return {
    schema,
    name,
    values,
    errors,
    rawErrors,
    touched,
    isSubmitting,
    isSubmitted,
    submitCount,
    isValid,
    validate: validateForm,
    validateField,
    getValue,
    setValue,
    setTouched,
    setError,
    clearErrors,
    reset,
    handleSubmit,
    getDependencies,
    context,
  };
}
