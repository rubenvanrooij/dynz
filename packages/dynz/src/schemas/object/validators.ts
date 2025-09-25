import { customRule } from "../../shared-rules";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import { maxRule } from "./rules/max-rule";
import { minRule } from "./rules/min-rule";
import type { ObjectSchema } from "./types";

export function validateObject(context: ValidateRuleContextUnion<ObjectSchema<never>>) {
  switch (context.ruleType) {
    case RuleType.MIN:
      return minRule(context);
    case RuleType.MAX:
      return maxRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
