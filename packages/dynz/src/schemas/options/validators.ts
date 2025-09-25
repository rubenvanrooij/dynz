import { customRule, equalsRule } from "../../shared-rules";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import type { OptionsSchema } from "./types";

export function validateOptions(context: ValidateRuleContextUnion<OptionsSchema>) {
  switch (context.ruleType) {
    case RuleType.EQUALS:
      return equalsRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
