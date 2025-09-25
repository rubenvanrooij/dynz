import { customRule, maxEntriesRule, minEntriesRule } from "../../shared-rules";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import type { ObjectSchema } from "./types";

export function validateObject(context: ValidateRuleContextUnion<ObjectSchema<never>>) {
  switch (context.ruleType) {
    case RuleType.MIN_ENTRIES:
      return minEntriesRule(context);
    case RuleType.MAX_ENTRIES:
      return maxEntriesRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
