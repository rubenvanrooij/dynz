import { isAfter } from "date-fns";
import { coerce, unpackRefValue } from "../../../resolve";
import type { AfterErrorMessage, AfterRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../../../types";
import { ErrorCode, type Reference } from "../../../types";
import { assertDate } from "../../../validate";
import type { DateSchema } from "../types";

export function afterRule({
  rule,
  value,
  path,
  schema,
  context,
}: ValidateRuleContext<DateSchema, AfterRule<Date | Reference>>):
  | OmitBaseErrorMessageProps<AfterErrorMessage>
  | undefined {
  const after = unpackRefValue(rule.after, path, context);
  const compareTo = assertDate(coerce(schema.type, after));
  return isAfter(value, compareTo)
    ? undefined
    : {
        code: ErrorCode.AFTER,
        after: compareTo,
        message: `The value ${value} for schema ${path} is before ${after}`,
      };
}
