import type { Reference } from "../../reference";
import type { AfterRule, BeforeRule, CustomRule, EqualsRule, MaxDateRule, MinDateRule } from "../../rules";
import type { BaseSchema, SchemaType } from "../../types";

export type DateRules =
  | MinDateRule
  | MaxDateRule
  | AfterRule<Date | Reference>
  | BeforeRule<Date | Reference>
  | EqualsRule<Date | Reference>
  | CustomRule;

export type DateSchema = BaseSchema<Date, typeof SchemaType.DATE, DateRules> & {
  coerce?: boolean;
};
