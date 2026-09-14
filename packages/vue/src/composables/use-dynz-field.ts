import { type ComputedRef, type MaybeRefOrGetter, type WritableComputedRef, computed, toValue } from "vue";
import { useField } from "vee-validate";
import { useDynzFormContext } from "../context";
import { useIsIncluded } from "./use-is-included";
import { useIsMutable } from "./use-is-mutable";
import { useIsRequired } from "./use-is-required";

export type UseDynzFieldReturn<TValue = unknown> = {
  /** The resolved field name. */
  name: ComputedRef<string>;

  /** Two-way bindable value; writing to it updates the form state. */
  value: WritableComputedRef<TValue | undefined>;

  /** The current error message, if any. */
  error: ComputedRef<string | undefined>;

  /** Whether the field has been blurred at least once. */
  isTouched: ComputedRef<boolean>;

  /** Tri-state conditional properties, straight from the schema. */
  required: ComputedRef<boolean | undefined>;
  included: ComputedRef<boolean | undefined>;
  mutable: ComputedRef<boolean | undefined>;

  /** `true` only when `mutable` resolves to exactly `false`. */
  readOnly: ComputedRef<boolean>;

  /** Writes a value and triggers validation according to the form's mode. */
  setValue: (value: TValue) => void;

  /** `@input` / `@update:modelValue` handler; accepts an Event or a raw value. */
  onInput: (eventOrValue: unknown) => void;

  /** `@blur` handler; marks the field touched. */
  onBlur: () => void;
};

/**
 * Binds a single field to the vee-validate form created by `useDynzForm` (or wired up
 * manually with `provideDynzContext` alongside vee-validate's own `useForm`).
 *
 * ```ts
 * const { value, error, required, readOnly, onInput, onBlur } = useDynzField("companyName");
 * ```
 */
export function useDynzField<TValue = unknown>(name: MaybeRefOrGetter<string>): UseDynzFieldReturn<TValue> {
  const context = useDynzFormContext();
  const fieldName = computed(() => toValue(name));

  const required = useIsRequired(fieldName);
  const included = useIsIncluded(fieldName);
  const mutable = useIsMutable(fieldName);
  const readOnly = computed(() => mutable.value === false);

  const field = useField<TValue>(fieldName);

  /**
   * `mode`/`revalidateMode` are only set by `useDynzForm`; a bare `provideDynzContext`
   * (vee-validate `useForm` wired up by hand) falls back to the same defaults
   * `useDynzForm` itself uses, so `useDynzField` behaves consistently either way.
   */
  function shouldValidateOn(event: "onInput" | "onBlur"): boolean {
    const isSubmitted = context.isSubmitted?.() ?? false;
    const mode = (isSubmitted ? context.revalidateMode : context.mode) ?? (isSubmitted ? "onInput" : "onSubmit");

    return mode === event;
  }

  function setValue(value: TValue): void {
    field.setValue(value, shouldValidateOn("onInput"));
  }

  return {
    name: fieldName,
    value: computed({
      get: () => field.value.value,
      set: (value) => setValue(value as TValue),
    }),
    error: computed(() => field.errorMessage.value),
    isTouched: computed(() => field.meta.touched),
    required,
    included,
    mutable,
    readOnly,
    setValue,
    onInput: (eventOrValue) => setValue(extractValue(eventOrValue) as TValue),
    // Deliberately not `field.handleChange`/`field.handleBlur(e, ...)` fed the raw event:
    // vee-validate's own DOM normalization diverges from `extractValue` below (e.g. an
    // unbound checkbox's value reads as the string "on", not `.checked`). `extractValue`
    // normalizes the event ourselves; `field.setValue`/`handleBlur` never re-normalize.
    onBlur: () => field.handleBlur(undefined, shouldValidateOn("onBlur")),
  };
}

/**
 * Accepts both DOM events (so `@input="onInput"` works on native inputs) and plain
 * values (so `@update:modelValue="onInput"` works on component inputs).
 */
function extractValue(eventOrValue: unknown): unknown {
  if (typeof Event === "undefined" || !(eventOrValue instanceof Event)) {
    return eventOrValue;
  }

  const target = eventOrValue.target;

  if (target === null || !(typeof target === "object") || !("value" in target)) {
    return eventOrValue;
  }

  const element = target as HTMLInputElement;

  if (element.type === "checkbox") {
    return element.checked;
  }

  if (element.type === "number" || element.type === "range") {
    return element.value === "" ? undefined : element.valueAsNumber;
  }

  return element.value;
}
