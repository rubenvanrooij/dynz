import { type DiscriminatedUnionSchema, findSchemaByPath, SchemaType } from "dynz";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { getUnionKeyDependencies } from "./get-union-key-dependencies";
import { useDynzFormContext } from "./use-dynz-form-context";

export function useDiscriminatedUnionKeyValues(name: string) {
  "use no memo";
  const { schema, control, getValues } = useDynzFormContext();
  const fieldPath = `$.${name}`;

  const dependencies = getUnionKeyDependencies(fieldPath, schema);

  useWatch({ name: dependencies, control, disabled: dependencies.length === 0 });

  const unionSchema = findSchemaByPath<DiscriminatedUnionSchema>(
    fieldPath,
    schema,
    SchemaType.DISCRIMINATED_UNION,
    getValues()
  );

  return useMemo(() => {
    const key = unionSchema.key;

    return unionSchema.schemas.map((member) => ({
      enabled: true,
      value: member[key] as string | number | boolean,
    }));
  }, [unionSchema]);
}
