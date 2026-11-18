import { type ResourceEntry, type ResourceStates, settledStates } from "dynz";

export type { ResourceEntry } from "dynz";

/**
 * Holds the resource lookups of a form outside React state. Its identity never changes, so
 * setting new entries does not re-render the form; hooks subscribe and re-render only when
 * what they derive from the entries changes.
 */
export type ResourceStore = {
  /** The lookups of the enabled instances, by instance path, e.g. `$.vehicle`. */
  getEntries: () => Record<string, ResourceEntry>;
  /** The settled lookups, as `resolve` takes them. Stable until the entries are set. */
  getStates: () => ResourceStates;
  set: (entries: Record<string, ResourceEntry>) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createResourceStore(): ResourceStore {
  const listeners = new Set<() => void>();
  let entries: Record<string, ResourceEntry> = {};
  let states: ResourceStates = {};

  return {
    getEntries: () => entries,
    getStates: () => states,
    set: (next) => {
      entries = next;
      states = settledStates(next);
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
