import type { CurrentResource } from "@dynz/form-resources";
import type { ResourceStates } from "dynz";
import { createContext, useContext } from "react";

type ResourcesContextValue = {
  /** Every enabled resource instance, by path (`$.vehicle`, `$.drivers.[0].vehicle`). */
  resources: Record<string, CurrentResource>;
  /** The settled instances' states, as dynz resolves `resourceRef`s against them. */
  states: ResourceStates;
};

/**
 * Internal (not exported from the package): provided by `DynzFormProvider`, next to
 * react-hook-form's own context, which only carries react-hook-form's methods.
 */
export const ResourcesContext = createContext<ResourcesContextValue>({ resources: {}, states: {} });

/** The resource states the condition hooks resolve against. */
export function useResourceStates(): ResourceStates {
  return useContext(ResourcesContext).states;
}

/** The settled instances' states, by path. Keeps each state object, so identity tells what changed. */
export function settledStates(resources: Record<string, CurrentResource>): ResourceStates {
  return Object.fromEntries(
    Object.entries(resources).flatMap(([path, resource]) =>
      resource.status === "settled" ? [[path, resource.state] as const] : []
    )
  );
}
