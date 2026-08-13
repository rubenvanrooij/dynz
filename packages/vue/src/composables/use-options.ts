import { type OptionsSchema, SchemaType, findSchemaByPath, resolvePredicate } from "dynz";
import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from "vue";
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

  const optionsSchema = computed(() =>
    findSchemaByPath<OptionsSchema>(toAbsolutePath(toValue(name)), context.schema, SchemaType.OPTIONS)
  );

  return computed(() => {
    const values = context.getValues();

    return optionsSchema.value.options.map((option): DynzOption => {
      if (typeof option !== "object") {
        return { value: option, enabled: true };
      }

      if (typeof option.enabled === "boolean") {
        return { value: option.value as DynzOption["value"], enabled: option.enabled };
      }

      return {
        value: option.value as DynzOption["value"],
        enabled: resolvePredicate(option.enabled, "$", { schema: context.schema, values }) ?? false,
      };
    });
  });
}
