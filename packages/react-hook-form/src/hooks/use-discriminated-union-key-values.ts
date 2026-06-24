import { type DiscriminatedUnionSchema, findSchemaByPath, SchemaType } from "dynz";
import { useMemo } from "react";
import { useDynzFormContext } from "./use-dynz-form-context";

export function useDiscriminatedUnionKeyValues(name: string) {
  const { schema } = useDynzFormContext();

  const unionSchema = findSchemaByPath<DiscriminatedUnionSchema>(`$.${name}`, schema, SchemaType.DISCRIMINATED_UNION);

  return useMemo(() => {
    const key = unionSchema.key;

    return unionSchema.schemas.map((member) => ({
      enabled: true,
      value: member[key] as string | number | boolean,
    }));
  }, [unionSchema]);
}
