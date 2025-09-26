import type { StringSchema } from "../../schemas/string/types";
import type { ErrorMessageFromRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../../types";

export type RegexRule = {
  type: "regex";
  regex: string;
  code?: string | undefined;
};

export type RegexRuleErrorMessage = ErrorMessageFromRule<RegexRule>;

export function regex(regex: string, code?: string): RegexRule {
  return { type: "regex", regex, code };
}

export function regexRule({
  rule,
  value,
}: ValidateRuleContext<StringSchema, RegexRule>): OmitBaseErrorMessageProps<RegexRuleErrorMessage> | undefined {
  const regex = new RegExp(rule.regex);
  return regex.test(value)
    ? undefined
    : {
        code: "regex",
        regex: rule.regex,
        message: `The value ${value} does not match the regex ${rule.regex}`,
      };
}
