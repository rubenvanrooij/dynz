import { findSchemaByPath, getOptionsForSchema, type OptionsSchema, SchemaType } from "dynz";
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from "vue";
import { useDynzFormContext } from "../context";
import { toAbsolutePath } from "../utils";

export type DynzOption = {
  value: string | number | boolean;
  enabled: boolean;
};

/**
 * Resolves the options of an options schema against the live form values.
 *
 * Unlike the React counterpart this returns every option together with its resolved
 * `enabled` flag instead of filtering, so a `<select>` can render disabled entries.
 * Filter yourself when you only want the selectable ones:
 *
 * ```ts
 * const selectable = computed(() => options.value.filter((option) => option.enabled));
 * ```
 */
export function useOptions(name: MaybeRefOrGetter<string>): ComputedRef<DynzOption[]> {
  const context = useDynzFormContext();

  return computed(() => {
    const fieldPath = toAbsolutePath(toValue(name));
    const optionsSchema = findSchemaByPath<OptionsSchema>(fieldPath, context.schema, SchemaType.OPTIONS);

    return getOptionsForSchema(optionsSchema, fieldPath, context.schema, context.getValues());
  });
}
