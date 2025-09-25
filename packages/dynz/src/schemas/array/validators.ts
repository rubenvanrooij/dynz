import { customRule } from "../../shared-rules";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import { maxRule, minRule } from "./rules";
import type { ArraySchema } from "./types";

export function validateArray(context: ValidateRuleContextUnion<ArraySchema<never>>) {
  switch (context.ruleType) {
    case RuleType.MIN:
      return minRule(context);
    case RuleType.MAX:
      return maxRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
