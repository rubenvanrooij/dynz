import type { CurrentResource } from "@dynz/form-resources";
import { useDynzFormContext } from "./use-dynz-form-context";

/**
 * Every enabled resource instance of the form, by path (`$.vehicle`, `$.drivers.[0].vehicle`),
 * with its `key` and its lookup: `pending`, `settled` with its `state`, or `failed` with its
 * `error`. `retry()` looks it up again. An instance that isn't enabled is absent.
 *
 * Reads the form provided by `DynzFormProvider`. In the component that calls `useDynzForm`
 * itself, read `form.resources` instead.
 *
 * ```tsx
 * const vehicle = useResources()["$.vehicle"];
 * if (vehicle?.status === "pending") return <Spinner />;
 * if (vehicle?.status === "failed") return <button onClick={vehicle.retry}>Try again</button>;
 * ```
 */
export function useResources(): Record<string, CurrentResource> {
  return useDynzFormContext().resources;
}
