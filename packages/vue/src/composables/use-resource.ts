import type { CurrentResource } from "@dynz/form-resources";
import { type ComputedRef, computed } from "vue";
import { type DynzContext, useDynzFormContext } from "../context";

/**
 * Every enabled resource instance of the form, by path (`$.vehicle`, `$.drivers.[0].vehicle`),
 * with its `key` and its lookup: `pending`, `settled` with its `state`, or `failed` with its
 * `error`. `retry()` looks it up again. An instance that isn't enabled is absent.
 *
 * In a descendant of the form the context is injected; in the component that calls
 * `useDynzForm` itself, pass the form's `context` (Vue's `inject` does not see a component's
 * own `provide`).
 *
 * ```ts
 * const resources = useResources();
 * const vehicle = computed(() => resources.value["$.vehicle"]);
 * // v-if="vehicle?.status === 'failed'" @click="vehicle.retry()"
 * ```
 */
export function useResources(
  context: DynzContext<never> | DynzContext = useDynzFormContext()
): ComputedRef<Record<string, CurrentResource>> {
  return computed(() => context.getResourceInstances?.() ?? {});
}
