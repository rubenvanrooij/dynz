import type {
  AfterRule,
  BaseSchema,
  BeforeRule,
  CustomRule,
  EqualsRule,
  MaxDateRule,
  MinDateRule,
  Reference,
  SchemaType,
} from "../../types";

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
