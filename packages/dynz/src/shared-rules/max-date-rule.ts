import { isBefore } from "date-fns";
import { unpackRefValue } from "../resolve";
import type { DateSchema } from "../schemas";
import {
  ErrorCode,
  type MaxDateErrorMessage,
  type MaxDateRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertDate } from "../validate";

export function maxDateRule({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<DateSchema, MaxDateRule>): OmitBaseErrorMessageProps<MaxDateErrorMessage> | undefined {
  const max = unpackRefValue(rule.max, path, context);
  const compareTo = assertDate(max);
  return isBefore(value, compareTo) || value.getTime() === compareTo.getTime()
    ? undefined
    : {
        code: ErrorCode.MAX_DATE,
        max: compareTo,
        message: `The value ${value} for schema ${path} is after or on ${max}`,
      };
}
