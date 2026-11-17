import type { ResourceEntry } from "dynz";
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from "vue";
import { type DynzContext, useDynzFormContext } from "../context";

/**
 * The lookup of the resource instance at `path` (e.g. `"$.vehicle"`, `"$.drivers.[0].vehicle"`),
 * or `undefined` when it isn't enabled.
 *
 * In a descendant of the form the context is injected. In the component that calls
 * `useDynzForm` itself, pass the form's `context`: Vue's `inject` does not see a component's
 * own `provide`.
 *
 * ```ts
 * const { context } = useDynzForm({ schema, schemaOptions: { resolvers } });
 * const vehicle = useResource("$.vehicle", context);
 * const loading = computed(() => vehicle.value?.status === "pending");
 * ```
 */
export function useResource(
  path: MaybeRefOrGetter<string>,
  context: DynzContext<never> | DynzContext = useDynzFormContext()
): ComputedRef<ResourceEntry | undefined> {
  return computed(() => context.getResourceEntries?.()[toValue(path)]);
}
