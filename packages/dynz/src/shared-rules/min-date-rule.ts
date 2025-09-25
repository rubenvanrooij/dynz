import { isAfter } from "date-fns";
import { unpackRefValue } from "../resolve";
import type { DateSchema } from "../schemas";
import {
  ErrorCode,
  type MinDateErrorMessage,
  type MinDateRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertDate } from "../validate";

export function minDateRule({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<DateSchema, MinDateRule>): OmitBaseErrorMessageProps<MinDateErrorMessage> | undefined {
  const min = unpackRefValue(rule.min, path, context);
  // TODO: make assertion part of unpacking a ref; because assertion is only required if it is a reference
  const compareTo = assertDate(min);
  return isAfter(value, compareTo) || value.getTime() === compareTo.getTime()
    ? undefined
    : {
        code: ErrorCode.MIN_DATE,
        min: compareTo,
        message: `The value ${value} for schema ${path} is before or on ${min}`,
      };
}
