import { type EmailRule, ErrorCode, type ValidateRuleContext } from "../../../types";
import type { StringSchema } from "../types";

const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-.]*)[a-z0-9_'+-]@([a-z0-9][a-z0-9-]*\.)+[a-z]{2,}$/i;

export function emailRule({ value }: ValidateRuleContext<StringSchema, EmailRule>) {
  return EMAIL_REGEX.test(value)
    ? undefined
    : {
        code: ErrorCode.EMAIL,
        message: `The value ${value} is not a valid email address`,
      };
}
