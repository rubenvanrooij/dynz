import { isBefore } from "date-fns";
import { type Reference, unpackRef } from "../../reference";
import type { DateSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type OmitBaseErrorMessageProps,
  SchemaType,
  type ValidateRuleContext,
} from "../../types";
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
  context,
}: ValidateRuleContext<DateSchema, BeforeRule<Date | Reference>>):
  | OmitBaseErrorMessageProps<BeforeRuleErrorMessage>
  | undefined {
  const { value: before } = unpackRef(rule.before, path, context, SchemaType.DATE);

  if (before === undefined) {
    return undefined;
  }

  return isBefore(value, before)
    ? undefined
    : {
        code: "before",
        before: before,
        message: `The value ${value} for schema ${path} is after ${before}`,
      };
}
