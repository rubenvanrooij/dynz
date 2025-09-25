import type { Reference } from "../../conditions";
import type { AfterRule, BeforeRule, CustomRule, EqualsRule, MaxDateRule, MinDateRule } from "../../shared-rules";
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
