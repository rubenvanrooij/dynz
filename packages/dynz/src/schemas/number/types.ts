import type { CustomRule, EqualsRule, MaxPrecisionRule, MaxRule, MinRule, OneOfRule } from "../../rules";
import type { BaseSchema, SchemaType } from "../../types";

/**
 * NUMBER SCHEMA
 */
export type NumberRules = MinRule | MaxRule | MaxPrecisionRule | EqualsRule | CustomRule | OneOfRule;

export type NumberSchema = BaseSchema<number, typeof SchemaType.NUMBER, NumberRules> & {
  coerce?: boolean;
};
