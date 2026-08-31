import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { useConditionalProperty } from "./use-conditional-property";

/**
 * Whether a field may still be changed given the current form values. A field is
 * read only when this resolves to exactly `false`.
 */
export function useIsMutable(name: MaybeRefOrGetter<string>): ComputedRef<boolean | undefined>;
export function useIsMutable(names: MaybeRefOrGetter<string[]>): ComputedRef<(boolean | undefined)[]>;
export function useIsMutable(name: MaybeRefOrGetter<string | string[]>) {
  return useConditionalProperty(name, "mutable");
}
