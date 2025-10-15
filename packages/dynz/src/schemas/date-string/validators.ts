import { afterRule, beforeRule, customRule, equalsDateRule, maxDateRule, minDateRule } from "../../rules";
import type { ValidateRuleContextUnion } from "../../types";
import type { DateStringSchema } from "./types";

// @ts-expect-error - tmp
export function validateDateString(context: ValidateRuleContextUnion<DateStringSchema>) {
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
