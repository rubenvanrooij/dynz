import type { Reference } from "../../conditions";
import type { CustomRule, EqualsRule, MaxPrecisionRule, MaxRule, MinRule, OneOfRule } from "../../shared-rules";
import type { BaseSchema, SchemaType } from "../../types";

/**
 * NUMBER SCHEMA
 */
export type NumberRules =
  | MinRule
  | MaxRule
  | MaxPrecisionRule
  | EqualsRule<number | Reference>
  | CustomRule
  | OneOfRule<Array<number | Reference>>;

export type NumberSchema = BaseSchema<number, typeof SchemaType.NUMBER, NumberRules> & {
  coerce?: boolean;
};
