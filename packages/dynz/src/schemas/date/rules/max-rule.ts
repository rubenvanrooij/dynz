import { isBefore } from "date-fns";
import { coerce, unpackRefValue } from "../../../resolve";
import type { MaxErrorMessage, MaxRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../../../types";
import { ErrorCode, type Reference } from "../../../types";
import { assertDate } from "../../../validate";
import type { DateSchema } from "../types";

export function maxRule({
  rule,
  value,
  path,
  schema,
  context,
}: ValidateRuleContext<DateSchema, MaxRule<Date | Reference>>): OmitBaseErrorMessageProps<MaxErrorMessage> | undefined {
  const max = unpackRefValue(rule.max, path, context);
  const compareTo = assertDate(coerce(schema.type, max));
  return isBefore(value, compareTo) || value.getTime() === compareTo.getTime()
    ? undefined
    : {
        code: ErrorCode.MAX,
        max: compareTo,
        message: `The value ${value} for schema ${path} is after or on ${max}`,
      };
}
