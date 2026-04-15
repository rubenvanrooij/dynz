import type { Rule } from "../../rules";
import type { BaseSchema, Schema, SchemaType, SchemaValuesInternal } from "../../types";

/**
 * ARRAY SCHEMA
 */
export type ArraySchema<T extends Schema> = BaseSchema<
  [T] extends [never] ? unknown[] : SchemaValuesInternal<T>[],
  typeof SchemaType.ARRAY,
  Rule[]
> & {
  schema: [T] extends [never] ? Schema : T;
  coerce?: boolean;
};
