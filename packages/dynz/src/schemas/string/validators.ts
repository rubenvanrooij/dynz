import { customRule, equalsRule, maxLengthRule, minLengthRule, oneOfRule } from "../../shared-rules";
import { emailRule } from "../../shared-rules/email-rule";
import { isNumericRule } from "../../shared-rules/is-numeric-rule";
import { regexRule } from "../../shared-rules/regex-rule";
import type { ValidateRuleContextUnion } from "../../types";
import type { StringSchema } from "./types";

export function validateString(context: ValidateRuleContextUnion<StringSchema>) {
  switch (context.ruleType) {
    case "min_length":
      return minLengthRule(context);
    case "max_length":
      return maxLengthRule(context);
    case "equals":
      return equalsRule(context);
    case "regex":
      return regexRule(context);
    case "is_numeric":
      return isNumericRule(context);
    case "email":
      return emailRule(context);
    case "one_of":
      return oneOfRule(context);
    case "custom":
      return customRule(context);
  }
}
