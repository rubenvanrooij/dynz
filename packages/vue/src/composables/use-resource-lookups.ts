import {
  getEnabledResources,
  lookupResource,
  reconcileResourceEntries,
  type ResourceEntries,
  type ResourceResolvers,
  type ResourceStates,
  type Schema,
  settledStates,
  settleResourceEntry,
} from "dynz";
import { type ComputedRef, computed, type ShallowRef, shallowRef, watchEffect } from "vue";

export type ResourceLookups = {
  /** Every lookup (pending, settled or failed), by instance path. */
  entries: Readonly<ShallowRef<ResourceEntries>>;
  /** The settled lookups, as `resolve` takes them. */
  states: ComputedRef<ResourceStates>;
};

/**
 * Looks up the form's enabled resources. Re-evaluates which resources are enabled whenever a
 * value it read changes, or a lookup settles (a resource may depend on another one's state),
 * and looks up the instances whose key changed. A failed lookup is retried only when its key
 * changes; caching lookups is up to the resolvers.
 *
 * @param getValues - must return the *reactive* values, so the effect tracks what it reads
 */
export function useResourceLookups(
  schema: Schema,
  getValues: () => unknown,
  resolvers: ResourceResolvers | undefined
): ResourceLookups {
  const entries = shallowRef<ResourceEntries>({});
  const states = computed(() => settledStates(entries.value));

  // read without tracking: the effect re-runs on `states`, not on every pending entry it sets
  let current: ResourceEntries = {};
  const set = (next: ResourceEntries) => {
    current = next;
    entries.value = next;
  };

  if (resolvers !== undefined) {
    watchEffect(() => {
      const { entries: next, started } = reconcileResourceEntries(
        current,
        getEnabledResources(schema, getValues(), states.value)
      );

      if (next !== current) {
        set(next);
      }

      started.forEach((instance) => {
        void lookupResource(instance, resolvers).then((entry) => {
          const settled = settleResourceEntry(current, instance.path, entry);

          if (settled !== current) {
            set(settled);
          }
        });
      });
    });
  }

  return { entries, states };
}
