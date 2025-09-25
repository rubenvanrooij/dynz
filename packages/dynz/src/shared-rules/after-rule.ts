import { isAfter } from "date-fns";
import { coerce, unpackRefValue } from "../resolve";
import type { DateSchema } from "../schemas";
import {
  type AfterErrorMessage,
  type AfterRule,
  ErrorCode,
  type OmitBaseErrorMessageProps,
  type Reference,
  type ValidateRuleContext,
} from "../types";
import { assertDate } from "../validate";

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
