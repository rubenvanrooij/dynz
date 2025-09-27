import type { CustomRule } from "../../rules";
import type { BaseSchema, DateString, PrivateSchema, SchemaType } from "../../types";

export type DateStringRules = CustomRule;

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
