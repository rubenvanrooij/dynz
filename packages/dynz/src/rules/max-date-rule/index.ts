import { isBefore } from "date-fns";
import { type Reference, unpackRef } from "../../reference";
import type { DateSchema, DateStringSchema } from "../../schemas";
import {
  type DateString,
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  SchemaType,
} from "../../types";
import { parseDateString } from "../../validate/validate-type";

export type MaxDateRule<T extends Date | DateString | Reference = Date | DateString | Reference> = {
  type: "max_date";
  max: T;
  code?: string | undefined;
};

export type MaxDateRuleErrorMessage = ErrorMessageFromRule<MaxDateRule>;

export function maxDate<T extends Date | Reference>(max: T, code?: string): MaxDateRule<T> {
  return { max, type: "max_date", code };
}

export const maxDateRule: RuleFn<
  DateSchema,
  Extract<ExtractResolvedRules<DateSchema>, MaxDateRule>,
  MaxDateRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const { value: max } = unpackRef(rule.max, path, context, SchemaType.DATE);

  if (max === undefined) {
    return undefined;
  }

  return isBefore(value, max) || value.getTime() === max.getTime()
    ? undefined
    : {
        code: "max_date",
        max,
        message: `The value ${value} for schema ${path} is after or on ${max}`,
      };
};

export const maxDateStringRule: RuleFn<
  DateStringSchema,
  Extract<ExtractResolvedRules<DateStringSchema>, MaxDateRule>,
  MaxDateRuleErrorMessage
> = ({ rule, value, path, context, schema }) => {
  const { value: max } = unpackRef(rule.max, path, context, SchemaType.DATE_STRING);

  if (max === undefined) {
    return undefined;
  }

  const maxDate = parseDateString(max, schema.format);
  const valueDate = parseDateString(value, schema.format);

  return isBefore(valueDate, maxDate) || valueDate.getTime() === maxDate.getTime()
    ? undefined
    : {
        code: "max_date",
        max,
        message: `The value ${value} for schema ${path} is after or on ${max}`,
      };
};
