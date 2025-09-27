import { isAfter } from "date-fns";
import { type Reference, unpackRef } from "../../reference";
import type { DateSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type OmitBaseErrorMessageProps,
  SchemaType,
  type ValidateRuleContext,
} from "../../types";

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
  const { value: min } = unpackRef(rule.min, path, context, SchemaType.DATE);

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
}
