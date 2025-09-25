import { customRule } from "../../shared-rules";
import { afterRule } from "../../shared-rules/after-rule";
import { beforeRule } from "../../shared-rules/before-rule";
import { maxDateRule } from "../../shared-rules/max-date-rule";
import { minDateRule } from "../../shared-rules/min-date-rule";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import { equalsRule } from "./rules";
import type { DateSchema } from "./types";

export function validateDate(context: ValidateRuleContextUnion<DateSchema>) {
  switch (context.ruleType) {
    case RuleType.EQUALS:
      return equalsRule(context);
    case RuleType.BEFORE:
      return beforeRule(context);
    case RuleType.AFTER:
      return afterRule(context);
    case RuleType.MIN_DATE:
      return minDateRule(context);
    case RuleType.MAX_DATE:
      return maxDateRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
