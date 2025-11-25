import { afterRule, beforeRule, customRule, equalsDateRule, maxDateRule, minDateRule } from "../../rules";
import type { ValidateRuleContextUnion } from "../../types";
import type { DateSchema } from "./types";

export function validateDate(context: ValidateRuleContextUnion<DateSchema>) {
  switch (context.ruleType) {
    case "equals":
      return equalsDateRule(context);
    case "before":
      return beforeRule(context);
    case "after":
      return afterRule(context);
    case "min_date":
      return minDateRule(context);
    case "max_date":
      return maxDateRule(context);
    case "custom":
      return customRule(context);
  }
}
