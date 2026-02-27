import { type ParamaterValue, resolveExpected } from "../../functions";
import type { DateSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";
import { isAfter } from "../after-rule";

export type MinDateRule<T extends ParamaterValue<Date> = ParamaterValue<Date>> = {
  type: "min_date";
  min: T;
  code?: string | undefined;
};

export type MinDateRuleErrorMessage = ErrorMessageFromRule<MinDateRule, Date, "min">;

export function minDate<T extends ParamaterValue<Date>>(min: T, code?: string): MinDateRule<T> {
  return { min, type: "min_date", code };
}

export const minDateRule: RuleFn<
  DateSchema,
  Extract<ExtractResolvedRules<DateSchema>, MinDateRule>,
  MinDateRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const min = resolveExpected(rule.min, path, context, SchemaType.DATE);

  if (min === undefined) {
    return undefined;
  }

  return isAfter(value, min) || value.getTime() === min.getTime()
    ? undefined
    : {
        code: "min_date",
        min,
        message: `The value ${value} for schema ${path} is before or on ${min}`,
      };
};
