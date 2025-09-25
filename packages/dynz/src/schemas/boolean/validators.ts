import { customRule, equalsRule } from "../../shared-rules";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import type { BooleanSchema } from "./types";

export function validateBoolean(context: ValidateRuleContextUnion<BooleanSchema>) {
  switch (context.ruleType) {
    case RuleType.EQUALS:
      return equalsRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
