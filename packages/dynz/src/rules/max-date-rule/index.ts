import { isBefore } from "date-fns";
import { type Reference, unpackRef } from "../../reference";
import type { DateSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type OmitBaseErrorMessageProps,
  SchemaType,
  type ValidateRuleContext,
} from "../../types";

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
}
