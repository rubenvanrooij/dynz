import { customRule, equalsRule, maxPrecisionRule, maxRule, minRule, oneOfRule } from "../../shared-rules";

import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import type { NumberSchema } from "./types";

export function validateNumber(context: ValidateRuleContextUnion<NumberSchema>) {
  switch (context.ruleType) {
    case RuleType.MIN:
      return minRule(context);
    case RuleType.MAX:
      return maxRule(context);
    case RuleType.EQUALS:
      return equalsRule(context);
    case RuleType.MAX_PRECISION:
      return maxPrecisionRule(context);
    case RuleType.ONE_OF:
      return oneOfRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
