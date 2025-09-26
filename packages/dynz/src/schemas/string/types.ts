import type { Reference } from "../../reference";
import type {
  CustomRule,
  EmailRule,
  EqualsRule,
  IsNumericRule,
  MaxLengthRule,
  MinLengthRule,
  OneOfRule,
  RegexRule,
} from "../../shared-rules";

import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

/**
 * STRING SCHEMA
 */
export type StringRules =
  | RegexRule
  | MinLengthRule
  | MaxLengthRule
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
