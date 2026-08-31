import { type ComputedRef, type MaybeRefOrGetter, type WritableComputedRef, computed, toValue } from "vue";
import { useDynzFieldAdapter } from "../context";
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
 * Binds a single field to the form created by `useDynzForm`.
 *
 * ```ts
 * const { value, error, required, readOnly, onInput, onBlur } = useDynzField("companyName");
 * ```
 */
export function useDynzField<TValue = unknown>(name: MaybeRefOrGetter<string>): UseDynzFieldReturn<TValue> {
  const context = useDynzFieldAdapter();
  const fieldName = computed(() => toValue(name));

  const required = useIsRequired(fieldName);
  const included = useIsIncluded(fieldName);
  const mutable = useIsMutable(fieldName);
  const readOnly = computed(() => mutable.value === false);

  function setValue(value: TValue): void {
    context.field.setValue(fieldName.value, value);
    context.field.handleInput(fieldName.value);
  }

  return {
    name: fieldName,
    value: computed({
      get: () => context.field.getValue(fieldName.value) as TValue | undefined,
      set: (value) => setValue(value as TValue),
    }),
    error: computed(() => context.field.getError(fieldName.value)),
    isTouched: computed(() => context.field.isTouched(fieldName.value)),
    required,
    included,
    mutable,
    readOnly,
    setValue,
    onInput: (eventOrValue) => setValue(extractValue(eventOrValue) as TValue),
    onBlur: () => context.field.handleBlur(fieldName.value),
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
