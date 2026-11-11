import { getConditionDependencies, type Predicate, resolvePredicate } from "dynz";
import { useSyncExternalStore } from "react";
import { useWatch } from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";

export function usePredicate(predicate: Predicate) {
  const { control, getValues, schema, resources } = useDynzFormContext();
  const dependencies = getConditionDependencies(predicate, "$", schema);

  // Watch is just here to trigger a rerender when a value gets updated
  useWatch({
    name: dependencies.map((dep) => dep.slice(2)),
    control,
  });

  // the result is a primitive, so a change in the resources only re-renders when it flips
  const getSnapshot = () =>
    resolvePredicate(predicate, "$", { schema, values: getValues(), resources: resources.getStates() });

  return useSyncExternalStore(resources.subscribe, getSnapshot, getSnapshot);
}
