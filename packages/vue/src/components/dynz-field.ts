import { type SlotsType, defineComponent } from "vue";
import { useDynzField } from "../composables";

export type DynzFieldSlotProps<TValue = unknown> = {
  name: string;
  value: TValue | undefined;
  error: string | undefined;
  isTouched: boolean;
  /** `true` unless the schema resolved `required` to exactly `false`. */
  required: boolean;
  /** `true` only when the schema resolved `mutable` to exactly `false`. */
  readOnly: boolean;
  /** The raw tri-state values, for the cases where the collapsed booleans lose information. */
  raw: {
    required: boolean | undefined;
    included: boolean | undefined;
    mutable: boolean | undefined;
  };
  setValue: (value: TValue) => void;
  onInput: (eventOrValue: unknown) => void;
  onBlur: () => void;
};

/**
 * Renderless field wrapper: resolves everything the schema says about a field and
 * hands it to the default slot, rendering nothing when the field is excluded.
 *
 * ```vue
 * <DynzField name="companyName" v-slot="{ value, required, readOnly, error, onInput, onBlur }">
 *   <input :value="value" :readonly="readOnly" :aria-required="required" @input="onInput" @blur="onBlur" />
 *   <span v-if="error">{{ error }}</span>
 * </DynzField>
 * ```
 */
export const DynzField = defineComponent({
  name: "DynzField",
  props: {
    name: { type: String, required: true },
    /** Render the slot even when the field is excluded. Defaults to `false`. */
    renderWhenExcluded: { type: Boolean, default: false },
  },
  slots: Object as SlotsType<{ default: DynzFieldSlotProps }>,
  setup(props, { slots }) {
    const field = useDynzField(() => props.name);

    return () => {
      if (!props.renderWhenExcluded && field.included.value === false) {
        return null;
      }

      return slots.default?.({
        name: field.name.value,
        value: field.value.value,
        error: field.error.value,
        isTouched: field.isTouched.value,
        required: field.required.value !== false,
        readOnly: field.readOnly.value,
        raw: {
          required: field.required.value,
          included: field.included.value,
          mutable: field.mutable.value,
        },
        setValue: field.setValue,
        onInput: field.onInput,
        onBlur: field.onBlur,
      });
    };
  },
});
