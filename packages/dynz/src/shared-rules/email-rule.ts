import type { StringSchema } from "../schemas/string/types";
import type { ErrorMessageFromRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../types";

export type EmailRule = {
  type: "email";
  code?: string | undefined;
};

export type EmailRuleErrorMessage = ErrorMessageFromRule<EmailRule>;

export function email(code?: string): EmailRule {
  return { type: "email", code };
}

const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-.]*)[a-z0-9_'+-]@([a-z0-9][a-z0-9-]*\.)+[a-z]{2,}$/i;

export function emailRule({
  value,
}: ValidateRuleContext<StringSchema, EmailRule>): OmitBaseErrorMessageProps<EmailRuleErrorMessage> | undefined {
  return EMAIL_REGEX.test(value)
    ? undefined
    : {
        code: "email",
        message: `The value ${value} is not a valid email address`,
      };
}
