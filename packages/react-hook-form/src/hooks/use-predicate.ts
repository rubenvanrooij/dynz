import { getConditionDependencies, type Predicate, resolvePredicate } from "dynz";
import { useWatch } from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";

export function usePredicate(predicate: Predicate) {
  const { control, getValues, schema } = useDynzFormContext();
  const dependencies = getConditionDependencies(predicate, "$", schema);

  // Watch is just here to trigger a rerender when a value gets updated
  useWatch({
    name: dependencies.map((dep) => dep.slice(2)),
    control,
  });

  return resolvePredicate(predicate, "$", {
    schema: schema,
    values: getValues(),
  });
}
