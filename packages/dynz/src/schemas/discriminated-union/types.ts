import type { BaseSchema, Schema, SchemaType } from "../../types";
import type { LiteralSchema } from "../literal";
import type { ObjectSchema } from "../object";

// Constraint used by the discriminatedUnion() builder to enforce a literal discriminator field.
// Only used at the call site — NOT as the TSchemas constraint in DiscriminatedUnionSchema,
// because when TKey = string the intersection collapses to Record<string, LiteralSchema>,
// which incorrectly requires every field to be a LiteralSchema.
export type ObjectSchemaWithDiscriminator<TKey extends string> = ObjectSchema<
  Record<TKey, LiteralSchema> & Record<string, Schema>
>;

export type DiscriminatedUnionSchema<
  TKey extends string = string,
  TSchemas extends ObjectSchema<never>[] = ObjectSchema<never>[],
> = BaseSchema<unknown, typeof SchemaType.DISCRIMINATED_UNION, never> & {
  key: TKey;
  schemas: [TSchemas] extends [never] ? ObjectSchema<never>[] : TSchemas;
};
