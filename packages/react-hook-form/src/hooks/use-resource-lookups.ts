import { type EnabledResource, getEnabledResources, type ResourceResolvers, type Schema } from "dynz";
import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { ResourceEntry, ResourceStore } from "./resource-store";

/**
 * Looks up the form's enabled resources into `resources`. Re-evaluates which resources are
 * enabled on every value change and every settled lookup (a resource may depend on another
 * one's state), and looks up the instances whose key changed. A failed lookup is retried only
 * when its key changes; caching lookups is up to the resolvers.
 *
 * Keep `resolvers` stable: a new object re-subscribes and re-evaluates.
 */
export function useResourceLookups<TFieldValues extends FieldValues>(
  form: Pick<UseFormReturn<TFieldValues>, "watch" | "getValues">,
  schema: Schema,
  resources: ResourceStore,
  resolvers: ResourceResolvers | undefined
): void {
  const { watch, getValues } = form;

  useEffect(() => {
    if (resolvers === undefined) {
      return;
    }

    const settle = ({ path }: EnabledResource, entry: ResourceEntry) => {
      // a result for a key the instance no longer has is stale
      if (resources.getEntries()[path]?.key === entry.key) {
        resources.set({ ...resources.getEntries(), [path]: entry });
      }
    };

    const evaluate = (values: unknown) => {
      const current = resources.getEntries();
      const { entries, started } = reconcile(current, getEnabledResources(schema, values, resources.getStates()));

      if (entries !== current) {
        resources.set(entries);
      }

      started.forEach((instance) => {
        void lookup(instance, resolvers).then((entry) => settle(instance, entry));
      });
    };

    evaluate(getValues());
    const { unsubscribe } = watch((values) => evaluate(values));
    // a settled lookup may enable (or disable) resources that depend on it; `evaluate` only
    // sets the store when the entries change, so the notification it causes settles at once
    const unsubscribeResources = resources.subscribe(() => evaluate(getValues()));

    return () => {
      unsubscribe();
      unsubscribeResources();
    };
  }, [schema, resolvers, resources, watch, getValues]);
}

/**
 * The entries for the enabled `instances`, given the `current` ones:
 * - an instance whose key is unchanged keeps its entry (pending, settled or failed);
 * - any other instance gets a new `pending` entry, and is listed in `started`;
 * - entries of instances that are no longer enabled are dropped.
 *
 * Returns `current` itself when nothing changed.
 */
function reconcile(
  current: Record<string, ResourceEntry>,
  instances: EnabledResource[]
): { entries: Record<string, ResourceEntry>; started: EnabledResource[] } {
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
async function lookup(instance: EnabledResource, resolvers: ResourceResolvers): Promise<ResourceEntry> {
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
