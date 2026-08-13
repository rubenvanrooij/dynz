import { type DiscriminatedUnionSchema, SchemaType, findSchemaByPath } from "dynz";
import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from "vue";
import { useDynzFormContext } from "../context";
import { toAbsolutePath } from "../utils";
import type { DynzOption } from "./use-options";

/**
 * The discriminator values of a discriminated union, shaped like {@link useOptions}
 * so both can drive the same `<select>` markup.
 */
export function useDiscriminatedUnionKeyValues(name: MaybeRefOrGetter<string>): ComputedRef<DynzOption[]> {
  const context = useDynzFormContext();

  return computed(() => {
    const unionSchema = findSchemaByPath<DiscriminatedUnionSchema>(
      toAbsolutePath(toValue(name)),
      context.schema,
      SchemaType.DISCRIMINATED_UNION
    );

    return unionSchema.schemas.map((member) => ({
      enabled: true,
      value: member[unionSchema.key] as unknown as DynzOption["value"],
    }));
  });
}
