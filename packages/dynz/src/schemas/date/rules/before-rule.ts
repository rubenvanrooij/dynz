import { isBefore } from "date-fns";
import { coerce, unpackRefValue } from "../../../resolve";
import type { BeforeErrorMessage, BeforeRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../../../types";
import { ErrorCode, type Reference } from "../../../types";
import { assertDate } from "../../../validate";
import type { DateSchema } from "../types";

export function beforeRule({
  rule,
  value,
  path,
  schema,
  context,
}: ValidateRuleContext<DateSchema, BeforeRule<Date | Reference>>):
  | OmitBaseErrorMessageProps<BeforeErrorMessage>
  | undefined {
  const before = unpackRefValue(rule.before, path, context);
  const compareTo = assertDate(coerce(schema.type, before));
  return isBefore(value, compareTo)
    ? undefined
    : {
        code: ErrorCode.BEFORE,
        before: compareTo,
        message: `The value ${value} for schema ${path} is after ${before}`,
      };
}
