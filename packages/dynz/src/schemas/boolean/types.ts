import type { Reference } from "../../reference";
import type { CustomRule, EqualsRule } from "../../shared-rules";
import type { BaseSchema, SchemaType } from "../../types";

/**
 * BOOLEAN SCHEMA
 */
export type BooleanRules = EqualsRule<boolean | Reference> | CustomRule;
export type BooleanSchema = BaseSchema<number, typeof SchemaType.BOOLEAN, BooleanRules> & {
  coerce?: boolean;
};
