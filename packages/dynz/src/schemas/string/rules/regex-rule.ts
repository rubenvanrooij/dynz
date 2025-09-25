import { ErrorCode, type RegexRule, type ValidateRuleContext } from "../../../types";
import type { StringSchema } from "../types";

export function regexRule({ rule, value }: ValidateRuleContext<StringSchema, RegexRule>) {
  const regex = new RegExp(rule.regex);
  return regex.test(value)
    ? undefined
    : {
        code: ErrorCode.REGEX,
        regex: rule.regex,
        message: `The value ${value} does not match the regex ${rule.regex}`,
      };
}
