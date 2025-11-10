import { type Condition, getConditionDependencies, resolveCondition } from "dynz";
import { useWatch } from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";

export function useCondition(condition: Condition) {
  const { control, getValues, schema } = useDynzFormContext();
  const dependencies = getConditionDependencies(condition, "$");

  // Watch is just here to trigger a rerender when a value gets updated
  useWatch({
    name: dependencies.map((dep) => dep.slice(2)),
    control,
  });

  return resolveCondition(condition, "$", {
    schema: schema,
    values: {
      new: getValues(),
    },
  });
}
