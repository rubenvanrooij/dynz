import {
  type EnabledResource,
  findResources,
  getEnabledResources,
  type ResourceResolver,
  type ResourceResolvers,
  type ResourceState,
  type ResourceStates,
  type Schema,
} from "dynz";
import { changedResourcePaths } from "./resource-changes";

/**
 * An enabled resource instance as a form sees it: `pending` while it is looked up, `settled`
 * with its state, or `failed` when its resolver threw. `retry` looks it up again.
 */
export type CurrentResource = EnabledResource & { retry: () => void } & (
    | { status: "pending" }
    | { status: "settled"; state: ResourceState }
    | { status: "failed"; error: unknown }
  );

export type CurrentResources = {
  /** Every enabled instance, by its path (`$.vehicle`, `$.drivers.[0].vehicle`). */
  instances: Record<string, CurrentResource>;
  /** The settled instances' states, as `resolve` takes them. */
  states: ResourceStates;
};

/**
 * A form's resources: looks up every enabled instance for the form's values with `resolvers`,
 * once per resource name and key, and keeps the results for the form's lifetime. The form's
 * conditions, its UI and its validation all read this one cache, so they always agree.
 */
export type ResourceCache = {
  /** The resources for the latest values. Kept (same object) while nothing changed. */
  current: () => CurrentResources;
  /**
   * Evaluates the resources for `values`, and looks up enabled instances not looked up yet.
   * A running lookup of a key that is no longer current is aborted (its `signal`) and
   * forgotten: a resolver can debounce by waiting first and checking its `signal`.
   */
  update: (values: unknown) => void;
  /**
   * Calls `listener` whenever the cache changed: a lookup started, settled, failed or was
   * dropped. Read `current()` in it: it keeps its identity unless what it shows changed.
   * Returns the unsubscribe.
   */
  subscribe: (listener: () => void) => () => void;
  /**
   * Resolvers for `validate`, reading this cache: a lookup that already ran is not repeated,
   * and validation waits for one that is pending. A failed one has no state.
   */
  resolvers: ResourceResolvers;
  /** Aborts the lookups that are still running, forgets every result, and releases waiting validations. */
  dispose: () => void;
};

type Entry =
  | { status: "pending"; controller: AbortController }
  | { status: "settled"; state: ResourceState }
  | { status: "failed"; error: unknown };

const NONE: CurrentResources = { instances: {}, states: {} };

/**
 * Creates the {@link ResourceCache} of a form validating against `schema`. `resolvers` may be
 * a getter, read on every lookup, so a component can pass new resolvers each render.
 *
 * Resources may depend on other resources (a `resourceRef` in `key`, `enabled` or an
 * `included`), so evaluating works in rounds like {@link evaluateResources}: the instances
 * enabled given the states so far are looked up, until the states stop changing.
 *
 * Each lookup gets a `signal`, aborted once its key is no longer current (the user typed on)
 * or it is retried. Debounce a resolver by waiting before the request, and give up when the
 * signal is aborted.
 *
 * Two kinds of failure: an expected one is an outcome the resolver returns, which the schema
 * handles. A resolver that throws is unexpected: its instance is `failed` and the error logged;
 * it is not looked up again until it is retried, and validation gets no state for it (a
 * `resourceRef` to it is `undefined`).
 *
 * @example
 * const cache = createResourceCache(schema, {
 *   vehicle: async (plate, { signal }) => (await fetch(`/vehicles/${plate}`, { signal })).json(),
 * });
 * cache.update(values);
 * await validate(schema, undefined, values, { resolvers: cache.resolvers });
 */
export function createResourceCache(
  schema: Schema,
  resolvers: ResourceResolvers | (() => ResourceResolvers)
): ResourceCache {
  const entries = new Map<string, Entry>();
  // the form, and validations waiting for a lookup
  const listeners = new Set<() => void>();
  const maxRounds = findResources(schema).length;

  let values: unknown;
  let current = NONE;

  const load = (instance: EnabledResource): Entry => {
    const id = idOf(instance);
    const existing = entries.get(id);

    if (existing !== undefined) {
      return existing;
    }

    const resolver = (typeof resolvers === "function" ? resolvers() : resolvers)[instance.name];

    if (resolver === undefined) {
      const failed: Entry = {
        status: "failed",
        error: new Error(`No resolver for resource "${instance.name}" at ${instance.path}`),
      };
      reportFailure(instance, failed.error);
      entries.set(id, failed);
      return failed;
    }

    const entry: Entry = { status: "pending", controller: new AbortController() };
    entries.set(id, entry);

    const { path, name, objectPath, resource, key } = instance;
    Promise.resolve()
      .then(() => resolver(key, { path, name, objectPath, resource, key, signal: entry.controller.signal }))
      .then(
        (state): Entry => ({ status: "settled", state }),
        (error): Entry => ({ status: "failed", error })
      )
      .then((next) => {
        // retried or disposed meanwhile: a newer lookup (or none) owns the entry
        if (entries.get(id) === entry) {
          if (next.status === "failed") {
            reportFailure(instance, next.error);
          }
          entries.set(id, next);
          changed();
        }
      });

    return entry;
  };

  const evaluate = (): CurrentResources => {
    const round = (
      states: ResourceStates,
      remaining: number
    ): { enabled: EnabledResource[]; states: ResourceStates } => {
      const enabled = getEnabledResources(schema, values, states);
      const next = Object.fromEntries(
        enabled.flatMap((instance) => {
          const entry = load(instance);
          return entry.status === "settled" ? [[instance.path, entry.state] as const] : [];
        })
      );

      return remaining === 0 || changedResourcePaths(states, next).length === 0
        ? { enabled, states: next }
        : round(next, remaining - 1);
    };

    const { enabled, states } = round({}, maxRounds);
    const instances = Object.fromEntries(
      enabled.map((instance): [string, CurrentResource] => {
        const entry = load(instance);
        const retry = () => retryEntry(instance);

        return [
          instance.path,
          entry.status === "settled"
            ? { ...instance, retry, status: "settled", state: entry.state }
            : entry.status === "failed"
              ? { ...instance, retry, status: "failed", error: entry.error }
              : { ...instance, retry, status: "pending" },
        ];
      })
    );

    return { instances, states };
  };

  const notify = () => {
    for (const listener of [...listeners]) {
      listener();
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  /** Evaluates `current` again; keeps the snapshot (hooks compare by identity) when the same. */
  const refresh = (): boolean => {
    const next = evaluate();
    const moved = !sameResources(current, next);

    if (moved) {
      current = next;
    }
    return moved;
  };

  // an entry changed
  const changed = () => {
    refresh();
    notify();
  };

  const retryEntry = (instance: EnabledResource) => {
    const entry = entries.get(idOf(instance));

    if (entry?.status === "pending") {
      entry.controller.abort();
    }
    entries.delete(idOf(instance));
    load(instance);
    changed();
  };

  /** Aborts and forgets the running lookups of keys the values moved away from. */
  const dropOutdated = (): boolean => {
    const live = new Set(Object.values(current.instances).map(idOf));
    const outdated = [...entries].filter(([id, entry]) => entry.status === "pending" && !live.has(id));

    for (const [id, entry] of outdated) {
      if (entry.status === "pending") {
        entry.controller.abort();
      }
      entries.delete(id);
    }
    return outdated.length > 0;
  };

  const resolver: ResourceResolver = (_key, instance) => {
    const id = idOf(instance);
    const first = load(instance);

    if (first.status !== "pending") {
      return stateOf(first);
    }

    return new Promise<ResourceState>((resolve) => {
      const stop = subscribe(() => {
        const entry = entries.get(id);

        // dropped: the values moved on, so this validation is outdated and the next one
        // replaces it; resolve without a state (a `resourceRef` to it is `undefined`)
        if (entry === undefined || entry.status !== "pending") {
          stop();
          resolve(stateOf(entry));
        }
      });
    });
  };

  return {
    current: () => current,
    update: (next) => {
      values = next;
      const moved = refresh();
      const dropped = dropOutdated();

      if (moved || dropped) {
        notify();
      }
    },
    subscribe,
    resolvers: Object.fromEntries(findResources(schema).map(({ name }) => [name, resolver])),
    dispose: () => {
      for (const entry of entries.values()) {
        if (entry.status === "pending") {
          entry.controller.abort();
        }
      }
      // listeners stay: a component that unmounts and mounts again (React's strict mode)
      // keeps its cache, which looks the instances up again on the next `update`
      entries.clear();
      // validations still waiting resolve without the states, instead of waiting forever
      notify();
    },
  };
}

/** A failed or dropped lookup has no state: a `resourceRef` to it resolves to `undefined`. */
function stateOf(entry: Entry | undefined): ResourceState {
  return (entry?.status === "settled" ? entry.state : undefined) as ResourceState;
}

/** A resolver should return a fallback outcome instead of throwing: make a throw visible. */
function reportFailure({ name, path }: EnabledResource, error: unknown): void {
  console.error(`[dynz] The lookup of resource "${name}" at ${path} failed`, error);
}

/** One lookup per resource name and key: instances sharing both share the lookup. */
function idOf({ name, key }: EnabledResource): string {
  return `${name}\u0000${typeof key}\u0000${String(key)}`;
}

function sameResources(a: CurrentResources, b: CurrentResources): boolean {
  const paths = Object.keys(b.instances);

  return (
    paths.length === Object.keys(a.instances).length &&
    paths.every((path) => {
      const [before, after] = [a.instances[path], b.instances[path]];

      return (
        before !== undefined &&
        after !== undefined &&
        before.key === after.key &&
        before.status === after.status &&
        a.states[path] === b.states[path] &&
        (before.status !== "failed" || after.status !== "failed" || before.error === after.error)
      );
    })
  );
}
