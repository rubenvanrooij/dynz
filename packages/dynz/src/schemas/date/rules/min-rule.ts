import { isAfter } from "date-fns";
import { coerce, unpackRefValue } from "../../../resolve";
import type { OmitBaseErrorMessageProps, ValidateRuleContext } from "../../../types";
import { ErrorCode, type MinErrorMessage, type MinRule, type Reference } from "../../../types";
import { assertDate } from "../../../validate";
import type { DateSchema } from "../types";

export function minRule({
  rule,
  value,
  path,
  schema,
  context,
}: ValidateRuleContext<DateSchema, MinRule<Date | Reference>>): OmitBaseErrorMessageProps<MinErrorMessage> | undefined {
  const min = unpackRefValue(rule.min, path, context);
  const compareTo = assertDate(coerce(schema.type, min));
  return isAfter(value, compareTo) || value.getTime() === compareTo.getTime()
    ? undefined
    : {
        code: ErrorCode.MIN,
        min: compareTo,
        message: `The value ${value} for schema ${path} is before or on ${min}`,
      };
}
