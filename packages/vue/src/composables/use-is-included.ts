import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { useConditionalProperty } from "./use-conditional-property";

/**
 * Whether a field is included given the current form values. Resolves to `false` as
 * soon as any ancestor is excluded.
 */
export function useIsIncluded(name: MaybeRefOrGetter<string>): ComputedRef<boolean | undefined>;
export function useIsIncluded(names: MaybeRefOrGetter<string[]>): ComputedRef<(boolean | undefined)[]>;
export function useIsIncluded(name: MaybeRefOrGetter<string | string[]>) {
  return useConditionalProperty(name, "included");
}
