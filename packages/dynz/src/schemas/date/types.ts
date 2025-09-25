import type {
  AfterRule,
  BaseSchema,
  BeforeRule,
  CustomRule,
  EqualsRule,
  MaxRule,
  MinRule,
  Reference,
  SchemaType,
} from "../../types";

export type DateRules =
  | MinRule<Date | Reference>
  | MaxRule<Date | Reference>
  | AfterRule<Date | Reference>
  | BeforeRule<Date | Reference>
  | EqualsRule<Date | Reference>
  | CustomRule;

export type DateSchema = BaseSchema<Date, typeof SchemaType.DATE, DateRules> & {
  coerce?: boolean;
};
