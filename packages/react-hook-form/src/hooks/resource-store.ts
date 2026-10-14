import type { ResourceKey, ResourceState, ResourceStates } from "dynz";

/** The lookup of one resource instance, by the key it was looked up with. */
export type ResourceEntry =
  | { status: "pending"; key: ResourceKey }
  | { status: "settled"; key: ResourceKey; state: ResourceState }
  | { status: "failed"; key: ResourceKey; error: unknown };

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
      states = Object.fromEntries(
        Object.entries(next).flatMap(([path, entry]) => (entry.status === "settled" ? [[path, entry.state]] : []))
      );
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
