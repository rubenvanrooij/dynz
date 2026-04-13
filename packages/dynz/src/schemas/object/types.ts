import type { Rule } from "../../rules";
import type { BaseSchema, Schema, SchemaType, SchemaValuesInternal } from "../../types";

/**
 * OBJECT SCHEMA
 */
export type ObjectSchema<T extends Record<string, Schema>> = BaseSchema<
  [T] extends [never] ? Record<string, unknown> : { [A in keyof T]: SchemaValuesInternal<T[A]> },
  typeof SchemaType.OBJECT,
  Rule
> & {
  fields: [T] extends [never] ? Record<string, Schema> : T;
};
