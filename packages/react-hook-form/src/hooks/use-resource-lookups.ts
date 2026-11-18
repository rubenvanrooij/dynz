import {
  type EnabledResource,
  getEnabledResources,
  lookupResource,
  type ResourceEntry,
  type ResourceResolvers,
  reconcileResourceEntries,
  type Schema,
  settleResourceEntry,
} from "dynz";
import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { ResourceStore } from "./resource-store";

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
      const current = resources.getEntries();
      const next = settleResourceEntry(current, path, entry);

      if (next !== current) {
        resources.set(next);
      }
    };

    const evaluate = (values: unknown) => {
      const current = resources.getEntries();
      const { entries, started } = reconcileResourceEntries(
        current,
        getEnabledResources(schema, values, resources.getStates())
      );

      if (entries !== current) {
        resources.set(entries);
      }

      started.forEach((instance) => {
        void lookupResource(instance, resolvers).then((entry) => settle(instance, entry));
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
