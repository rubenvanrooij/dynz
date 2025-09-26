import { isBefore } from "date-fns";
import { type Reference, unpackRefValue } from "../../reference";
import type { DateSchema } from "../../schemas";
import type { ErrorMessageFromRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../../types";
import { coerce } from "../../utils";
import { assertDate } from "../../validate";

export type BeforeRule<T extends Date | Reference = Date | Reference> = {
  type: "before";
  before: T;
  code?: string | undefined;
};

export type BeforeRuleErrorMessage = ErrorMessageFromRule<BeforeRule>;

export function before<T extends Date | Reference>(before: T, code?: string): BeforeRule<T> {
  return { before, type: "before", code };
}

export function beforeRule({
  rule,
  value,
  path,
  schema,
  context,
}: ValidateRuleContext<DateSchema, BeforeRule<Date | Reference>>):
  | OmitBaseErrorMessageProps<BeforeRuleErrorMessage>
  | undefined {
  const before = unpackRefValue(rule.before, path, context);
  const compareTo = assertDate(coerce(schema, before));
  return isBefore(value, compareTo)
    ? undefined
    : {
        code: "before",
        before: compareTo,
        message: `The value ${value} for schema ${path} is after ${before}`,
      };
}
