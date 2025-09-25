import { customRule, equalsRule, oneOfRule } from "../../shared-rules";
import { RuleType, type ValidateRuleContextUnion } from "../../types";

import { emailRule } from "./rules/email-rule";
import { isNumericRule } from "./rules/is-numeric-rule";
import { maxRule } from "./rules/max-rule";
import { minRule } from "./rules/min-rule";
import { regexRule } from "./rules/regex-rule";
import type { StringSchema } from "./types";

export function validateString(context: ValidateRuleContextUnion<StringSchema>) {
  switch (context.ruleType) {
    case RuleType.MIN:
      return minRule(context);
    case RuleType.MAX:
      return maxRule(context);
    case RuleType.EQUALS:
      return equalsRule(context);
    case RuleType.REGEX:
      return regexRule(context);
    case RuleType.IS_NUMERIC:
      return isNumericRule(context);
    case RuleType.EMAIL:
      return emailRule(context);
    case RuleType.ONE_OF:
      return oneOfRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
