import { resolveProperty } from "dynz";
import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from "vue";
import { useDynzFormContext } from "../context";
import { toAbsolutePath } from "../utils";

export type ConditionalProperty = "mutable" | "required" | "included";

/**
 * Resolves a conditional schema property against the live form values.
 *
 * Unlike the React implementation this needs no dependency collection: `resolveProperty`
 * reads the values object from inside a `computed`, so Vue records exactly the
 * properties that were read on that run — including the reads made while walking
 * ancestors, which is what makes the "excluded ancestor short-circuits to false"
 * behaviour stay in sync for free.
 */
export function useConditionalProperty(
  name: MaybeRefOrGetter<string>,
  property: ConditionalProperty
): ComputedRef<boolean | undefined>;
export function useConditionalProperty(
  names: MaybeRefOrGetter<string[]>,
  property: ConditionalProperty
): ComputedRef<(boolean | undefined)[]>;
export function useConditionalProperty(
  name: MaybeRefOrGetter<string | string[]>,
  property: ConditionalProperty
): ComputedRef<boolean | undefined | (boolean | undefined)[]>;
export function useConditionalProperty(
  name: MaybeRefOrGetter<string | string[]>,
  property: ConditionalProperty
): ComputedRef<boolean | undefined | (boolean | undefined)[]> {
  const context = useDynzFormContext();

  return computed(() => {
    const resolved = toValue(name);
    const names = Array.isArray(resolved) ? resolved : [resolved];
    const values = context.getValues();

    const results = names.map((fieldName) =>
      resolveProperty(property, toAbsolutePath(fieldName), true, { schema: context.schema, values })
    );

    return Array.isArray(resolved) ? results : results[0];
  });
}
