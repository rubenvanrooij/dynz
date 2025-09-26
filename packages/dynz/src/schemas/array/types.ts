import type { CustomRule, MaxLengthRule, MinLengthRule } from "../../rules";
import type { BaseSchema, Schema, SchemaType, SchemaValuesInternal } from "../../types";

/**
 * ARRAY SCHEMA
 */
export type ArrayRules = MinLengthRule | MaxLengthRule | CustomRule;
export type ArraySchema<T extends Schema> = BaseSchema<
  [T] extends [never] ? unknown[] : SchemaValuesInternal<T>[],
  typeof SchemaType.ARRAY,
  ArrayRules
> & {
  schema: [T] extends [never] ? Schema : T;
  coerce?: boolean;
};
