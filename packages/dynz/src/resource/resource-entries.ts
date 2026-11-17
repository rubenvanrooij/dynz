import type { Schema } from "../types";
import { expandArrayItems, pathSegments } from "../utils";
import type { EnabledResource, ResourceKey, ResourceResolvers } from "./evaluate-resources";
import type { ResourceState, ResourceStates } from "./resource";

/**
 * Building blocks for keeping resource lookups in sync with a form, shared by the framework
 * integrations. They hold no state of their own: the integration stores the entries (a React
 * store, a Vue ref, …) and calls these to decide what to change.
 */

/** The lookup of one resource instance, by the key it was looked up with. */
export type ResourceEntry =
  | { status: "pending"; key: ResourceKey }
  | { status: "settled"; key: ResourceKey; state: ResourceState }
  | { status: "failed"; key: ResourceKey; error: unknown };

/** Lookups by resource instance path, e.g. `$.vehicle`. */
export type ResourceEntries = Record<string, ResourceEntry>;

/**
 * The entries for the enabled `instances`, given the `current` ones:
 * - an instance whose key is unchanged keeps its entry (pending, settled or failed);
 * - any other instance gets a new `pending` entry, and is listed in `started`;
 * - entries of instances that are no longer enabled are dropped.
 *
 * Returns `current` itself when nothing changed.
 */
export function reconcileResourceEntries(
  current: ResourceEntries,
  instances: EnabledResource[]
): { entries: ResourceEntries; started: EnabledResource[] } {
  const started = instances.filter(({ path, key }) => current[path]?.key !== key);
  const unchanged = started.length === 0 && instances.length === Object.keys(current).length;

  if (unchanged) {
    return { entries: current, started };
  }

  const entries = Object.fromEntries(
    instances.map(({ path, key }) => {
      const entry = current[path];
      return [path, entry !== undefined && entry.key === key ? entry : ({ status: "pending", key } as const)];
    })
  );

  return { entries, started };
}

/**
 * Runs the resolver for one instance. A failing resolver becomes a `failed` entry; a missing
 * resolver is a setup mistake and rejects.
 */
export async function lookupResource(instance: EnabledResource, resolvers: ResourceResolvers): Promise<ResourceEntry> {
  const { name, path, key } = instance;

  const resolver = resolvers[name];

  if (resolver === undefined) {
    throw new Error(`No resolver for resource "${name}" at ${path}`);
  }

  try {
    return { status: "settled", key, state: await resolver(key, instance) };
  } catch (error) {
    return { status: "failed", key, error };
  }
}

/**
 * `entries` with `entry` stored at `path`, or `entries` itself when the result is stale: the
 * instance was dropped or its key changed while it was being looked up.
 */
export function settleResourceEntry(entries: ResourceEntries, path: string, entry: ResourceEntry): ResourceEntries {
  return entries[path]?.key === entry.key ? { ...entries, [path]: entry } : entries;
}

/** The settled lookups, as `resolve` takes them (`resources` in a resolve context). */
export function settledStates(entries: ResourceEntries): ResourceStates {
  return Object.fromEntries(
    Object.entries(entries).flatMap(([path, entry]) => (entry.status === "settled" ? [[path, entry.state]] : []))
  );
}

/**
 * The instance paths whose state differs between `previous` and `next`. A settled entry keeps
 * its state object when the entries are replaced, so identity tells what changed.
 */
export function changedResourcePaths(previous: ResourceStates, next: ResourceStates): string[] {
  return Object.keys({ ...previous, ...next }).filter((path) => previous[path] !== next[path]);
}

/**
 * The schema paths that read any of the resource instances at `changed`, with every `[]`
 * expanded to the array items present in `values`. Matches by resource name, so a changed
 * `$.drivers.[1].driverClaims` returns the dependents of `driverClaims` in every item.
 *
 * @param dependents - from {@link getResourceDependents}
 *
 * @example
 * fieldPathsReadingResources(["$.vehicle"], { vehicle: ["$.make"] }, schema, values) // ["$.make"]
 */
export function fieldPathsReadingResources(
  changed: string[],
  dependents: Record<string, string[]>,
  schema: Schema,
  values: unknown
): string[] {
  const paths = changed
    .flatMap((path) => dependents[pathSegments(path).at(-1) ?? ""] ?? [])
    .flatMap((path) => expandArrayItems(path, schema, values));

  return [...new Set(paths)];
}
