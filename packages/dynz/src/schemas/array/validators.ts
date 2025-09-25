import { customRule } from "../../shared-rules";
import { maxLengthRule } from "../../shared-rules/max-length-rule";
import { minLengthRule } from "../../shared-rules/min-length-rule";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import type { ArraySchema } from "./types";

export function validateArray(context: ValidateRuleContextUnion<ArraySchema<never>>) {
  switch (context.ruleType) {
    case RuleType.MIN_LENGTH:
      return minLengthRule(context);
    case RuleType.MAX_LENGTH:
      return maxLengthRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
