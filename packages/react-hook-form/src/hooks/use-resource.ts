import { useSyncExternalStore } from "react";
import type { ResourceEntry } from "./resource-store";
import { useDynzFormContext } from "./use-dynz-form-context";

/**
 * The lookup of the resource instance at `path` (e.g. `"$.vehicle"`, `"$.drivers.[0].vehicle"`),
 * or `undefined` when it isn't enabled. Re-renders only when that instance's lookup changes.
 *
 * ```tsx
 * const vehicle = useResource("$.vehicle");
 * if (vehicle?.status === "pending") return <Spinner />;
 * ```
 */
export function useResource(path: string): ResourceEntry | undefined {
  const { resources } = useDynzFormContext();
  const getSnapshot = () => resources.getEntries()[path];

  return useSyncExternalStore(resources.subscribe, getSnapshot, getSnapshot);
}
