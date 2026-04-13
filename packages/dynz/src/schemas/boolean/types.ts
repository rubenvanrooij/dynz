import type { Rule } from "../../rules";
import type { BaseSchema, SchemaType } from "../../types";

/**
 * BOOLEAN SCHEMA
 */
export type BooleanSchema = BaseSchema<boolean, typeof SchemaType.BOOLEAN, Rule> & {
  coerce?: boolean;
};
