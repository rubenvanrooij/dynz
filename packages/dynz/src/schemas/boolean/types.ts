import type { CustomRule, EqualsRule } from "../../rules";
import type { BaseSchema, SchemaType } from "../../types";

/**
 * BOOLEAN SCHEMA
 */
export type BooleanRules = EqualsRule | CustomRule;
export type BooleanSchema = BaseSchema<number, typeof SchemaType.BOOLEAN, BooleanRules> & {
  coerce?: boolean;
};
