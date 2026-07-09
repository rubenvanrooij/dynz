import {
  type DiscriminatedUnionSchema,
  findSchemaByPath,
  getConditionDependencies,
  getDiscriminatorLiteral,
  isDynamicDiscriminatorValue,
  resolvePredicate,
  SchemaType,
} from "dynz";
import { useWatch } from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";

export function useDiscriminatedUnionKeyValues(name: string) {
  const { control, getValues, schema } = useDynzFormContext();

  // TODO: memoize
  const unionSchema = findSchemaByPath<DiscriminatedUnionSchema>(`$.${name}`, schema, SchemaType.DISCRIMINATED_UNION);

  // TODO: memoize
  const dependencies = unionSchema.schemas.reduce<string[]>((acc, member) => {
    const raw = member[unionSchema.key];
    if (isDynamicDiscriminatorValue(raw) && typeof raw.enabled !== "boolean") {
      acc.push(...getConditionDependencies(raw.enabled, "$", schema));
    }
    return acc;
  }, []);

  // Watch is just here to trigger a rerender when a value gets updated
  useWatch({
    name: dependencies.map((dep) => dep.slice(2)),
    control,
  });

  const values = getValues();

  return unionSchema.schemas.map((member) => {
    const raw = member[unionSchema.key];

    if (!isDynamicDiscriminatorValue(raw)) {
      return {
        enabled: true,
        value: raw as string | number | boolean,
      };
    }

    const enabled =
      typeof raw.enabled === "boolean" ? raw.enabled : resolvePredicate(raw.enabled, "$", { schema, values });

    return {
      enabled: Boolean(enabled),
      value: getDiscriminatorLiteral(raw),
    };
  });
}
