import { isAfter } from "date-fns";
import type { Reference } from "../conditions";
import { unpackRefValue } from "../resolve";
import type { DateSchema } from "../schemas";
import type { ErrorMessageFromRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../types";
import { assertDate } from "../validate";

export type MinDateRule<T extends Date | Reference = Date | Reference> = {
  type: "min_date";
  min: T;
  code?: string | undefined;
};

export type MinDateRuleErrorMessage = ErrorMessageFromRule<MinDateRule>;

export function minDate<T extends Date | Reference>(min: T, code?: string): MinDateRule<T> {
  return { min, type: "min_date", code };
}

export function minDateRule({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<DateSchema, MinDateRule>): OmitBaseErrorMessageProps<MinDateRuleErrorMessage> | undefined {
  const min = unpackRefValue(rule.min, path, context);
  // TODO: make assertion part of unpacking a ref; because assertion is only required if it is a reference
  const compareTo = assertDate(min);
  return isAfter(value, compareTo) || value.getTime() === compareTo.getTime()
    ? undefined
    : {
        code: "min_date",
        min: compareTo,
        message: `The value ${value} for schema ${path} is before or on ${min}`,
      };
}
