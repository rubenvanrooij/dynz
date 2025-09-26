import { isBefore } from "date-fns";
import { type Reference, unpackRefValue } from "../../reference";
import type { DateSchema } from "../../schemas";
import type { ErrorMessageFromRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../../types";
import { assertDate } from "../../validate";

export type MaxDateRule<T extends Date | Reference = Date | Reference> = {
  type: "max_date";
  max: T;
  code?: string | undefined;
};

export type MaxDateRuleErrorMessage = ErrorMessageFromRule<MaxDateRule>;

export function maxDate<T extends Date | Reference>(max: T, code?: string): MaxDateRule<T> {
  return { max, type: "max_date", code };
}

export function maxDateRule({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<DateSchema, MaxDateRule>): OmitBaseErrorMessageProps<MaxDateRuleErrorMessage> | undefined {
  const max = unpackRefValue(rule.max, path, context);
  const compareTo = assertDate(max);
  return isBefore(value, compareTo) || value.getTime() === compareTo.getTime()
    ? undefined
    : {
        code: "max_date",
        max: compareTo,
        message: `The value ${value} for schema ${path} is after or on ${max}`,
      };
}
