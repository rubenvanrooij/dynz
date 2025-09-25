import { customRule } from "../../shared-rules";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import { afterRule, beforeRule, equalsRule, maxRule, minRule } from "./rules";
import type { DateSchema } from "./types";

export function validateDate(context: ValidateRuleContextUnion<DateSchema>) {
  switch (context.ruleType) {
    case RuleType.EQUALS:
      return equalsRule(context);
    case RuleType.BEFORE:
      return beforeRule(context);
    case RuleType.AFTER:
      return afterRule(context);
    case RuleType.MIN:
      return minRule(context);
    case RuleType.MAX:
      return maxRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
