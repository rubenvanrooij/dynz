import type {
  BaseSchema,
  CustomRule,
  MaxRule,
  MinRule,
  Reference,
  Schema,
  SchemaType,
  SchemaValuesInternal,
} from "../../types";

/**
 * ARRAY SCHEMA
 */
export type ArrayRules = MinRule<number | Reference> | MaxRule<number | Reference> | CustomRule;
export type ArraySchema<T extends Schema> = BaseSchema<
  [T] extends [never] ? unknown[] : SchemaValuesInternal<T>[],
  typeof SchemaType.ARRAY,
  ArrayRules
> & {
  schema: [T] extends [never] ? Schema : T;
  coerce?: boolean;
};
