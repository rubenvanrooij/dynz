import type {
  BaseSchema,
  CustomRule,
  MaxEntriesRule,
  MinEntriesRule,
  Schema,
  SchemaType,
  SchemaValuesInternal,
} from "../../types";

/**
 * OBJECT SCHEMA
 */
export type ObjectRules = CustomRule | MinEntriesRule | MaxEntriesRule;
export type ObjectSchema<T extends Record<string, Schema>> = BaseSchema<
  [T] extends [never] ? Record<string, unknown> : { [A in keyof T]: SchemaValuesInternal<T[A]> },
  typeof SchemaType.OBJECT,
  ObjectRules
> & {
  fields: [T] extends [never] ? Record<string, Schema> : T;
};
