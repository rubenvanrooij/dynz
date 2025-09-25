import type { BaseSchema, CustomRule, EqualsRule, Reference, SchemaType } from "../../types";

/**
 * BOOLEAN SCHEMA
 */
export type BooleanRules = EqualsRule<boolean | Reference> | CustomRule;
export type BooleanSchema = BaseSchema<number, typeof SchemaType.BOOLEAN, BooleanRules> & {
  coerce?: boolean;
};
