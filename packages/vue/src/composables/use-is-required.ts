import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { useConditionalProperty } from "./use-conditional-property";

/**
 * Whether a field is required given the current form values.
 *
 * Keep the tri-state: compare with `!== false` rather than coercing with `!`, so the
 * "unresolved" signal is not collapsed into "not required".
 */
export function useIsRequired(name: MaybeRefOrGetter<string>): ComputedRef<boolean | undefined>;
export function useIsRequired(names: MaybeRefOrGetter<string[]>): ComputedRef<(boolean | undefined)[]>;
export function useIsRequired(name: MaybeRefOrGetter<string | string[]>) {
  return useConditionalProperty(name, "required");
}
