import {
  _resolveProperty,
  type DiscriminatedUnionSchema,
  findSchemaByPath,
  getConditionDependencies,
  type LiteralSchema,
  SchemaType,
} from "dynz";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";

export function useDiscriminatedUnionKeyValues(name: string) {
  const { control, getValues, schema } = useDynzFormContext();

  const unionSchema = findSchemaByPath<DiscriminatedUnionSchema>(`$.${name}`, schema, SchemaType.DISCRIMINATED_UNION);

  const dependencies = unionSchema.schemas.reduce<string[]>((acc, member) => {
    if (member.included !== undefined && typeof member.included !== "boolean") {
      acc.push(...getConditionDependencies(member.included, `$.${name}`, schema).map((d) => d.slice(2)));
    }
    return acc;
  }, []);

  const watchedValues = useWatch({
    name: dependencies,
    control,
    compute: (val) => JSON.stringify(val),
    disabled: dependencies.length === 0,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: watchedValues triggers the re-evaluation
  return useMemo(() => {
    const values = getValues();
    const context = { schema, values };
    const key = unionSchema.key;

    return unionSchema.schemas.map((member) => ({
      enabled: _resolveProperty(member, "included", `$.${name}`, true, context),
      value: (member.fields[key] as LiteralSchema).value,
    }));
  }, [schema, unionSchema, name, watchedValues]);
}
