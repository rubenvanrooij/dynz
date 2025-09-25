import type {
  BaseSchema,
  CustomRule,
  MaxLengthRule,
  MinLengthRule,
  Schema,
  SchemaType,
  SchemaValuesInternal,
} from "../../types";

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
