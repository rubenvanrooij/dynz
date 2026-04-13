import { findSchemaByPath, getConditionDependencies, type OptionsSchema, resolvePredicate, SchemaType } from "dynz";
import { useWatch } from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";

export function useOptions(name: string) {
  const { control, getValues, schema } = useDynzFormContext();

  // TODO: memoize
  const inner = findSchemaByPath<OptionsSchema>(`$.${name}}`, schema, SchemaType.OPTIONS);

  // TODO: memoize
  const dependencies = inner.options.reduce<string[]>((acc, option) => {
    if (typeof option === "object" && typeof option.enabled !== "boolean") {
      acc.push(...getConditionDependencies(option.enabled, "$", schema));
    }

    return acc;
  }, []);

  // Watch is just here to trigger a rerender when a value gets updated
  useWatch({
    name: dependencies.map((dep) => dep.slice(2)),
    control,
  });

  const values = getValues();

  return inner.options
    .map((option) => {
      if (typeof option !== "object") {
        return {
          enabled: true,
          value: option,
        };
      }

      if (typeof option.enabled === "boolean") {
        return {
          enabled: option.enabled,
          value: option.value,
        };
      }

      return {
        enabled: resolvePredicate(option.enabled, "$", {
          schema: schema,
          values,
        }),
      };
    })
    .filter(({ enabled }) => enabled)
    .map(({ value }) => value);
}
