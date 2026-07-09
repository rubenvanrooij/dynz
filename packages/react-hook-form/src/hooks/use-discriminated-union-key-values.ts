import {
  type DiscriminatedUnionSchema,
  findSchemaByPath,
  getConditionDependencies,
  isDiscriminator,
  isDiscriminatorEnabled,
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
    const discriminator = member[unionSchema.key];

    if (
      !isDiscriminator(discriminator) ||
      discriminator.enabled === undefined ||
      typeof discriminator.enabled === "boolean"
    ) {
      return acc;
    }

    acc.push(...getConditionDependencies(discriminator.enabled, "$", schema));
    return acc;
  }, []);

  // Watch is just here to trigger a rerender when a value gets updated
  useWatch({
    name: dependencies.map((dep) => dep.slice(2)),
    control,
  });

  const values = getValues();

  return unionSchema.schemas.map((member) => {
    const discriminator = member[unionSchema.key];

    if (!isDiscriminator(discriminator)) {
      throw new Error(`No discriminator schema found for member of union "${name}"`);
    }

    return {
      enabled: isDiscriminatorEnabled(discriminator, "$", { schema, values }),
      value: discriminator.value,
    };
  });
}
