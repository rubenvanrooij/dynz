import type {
  AfterRule,
  BaseSchema,
  BeforeRule,
  CustomRule,
  DateString,
  EqualsRule,
  MaxRule,
  MinRule,
  OneOfRule,
  PrivateSchema,
  Reference,
  RegexRule,
  SchemaType,
} from "../../types";

export type DateStringRules =
  | MinRule<DateString | Reference>
  | MaxRule<DateString | Reference>
  | AfterRule<DateString | Reference>
  | BeforeRule<DateString | Reference>
  | EqualsRule<DateString | Reference>
  | RegexRule
  | CustomRule
  | OneOfRule<Array<DateString | Reference>>;

export type DateStringSchema<
  TFormat extends string = string,
  TRule extends DateStringRules = DateStringRules,
> = BaseSchema<DateString, typeof SchemaType.DATE_STRING, TRule> &
  PrivateSchema & {
    /*
     * Unicode Tokens
     * @see https://github.com/date-fns/date-fns/blob/main/docs/unicodeTokens.md
     * @see https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     *
     * @default 'yyyy-MM-dd'
     */
    format: TFormat;
  };
