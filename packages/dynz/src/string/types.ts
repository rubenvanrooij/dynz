import type {
  BaseSchema,
  CustomRule,
  EmailRule,
  EqualsRule,
  IsNumericRule,
  MaxRule,
  MinRule,
  OneOfRule,
  PrivateSchema,
  Reference,
  RegexRule,
  SchemaType,
} from "../types";

/**
 * STRING SCHEMA
 */
export type StringRules =
  | RegexRule
  | MinRule<number | Reference>
  | MaxRule<number | Reference>
  | EqualsRule
  | IsNumericRule
  | EmailRule
  | CustomRule
  | OneOfRule<Array<string | Reference>>;

export type StringSchema<TRule extends StringRules = StringRules> = BaseSchema<
  string,
  typeof SchemaType.STRING,
  TRule
> &
  PrivateSchema & { coerce?: boolean };
