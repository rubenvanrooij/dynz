import { customRule, equalsDateRule } from "../../rules";
import { afterRule } from "../../rules/after-rule";
import { beforeRule } from "../../rules/before-rule";
import { maxDateRule } from "../../rules/max-date-rule";
import { minDateRule } from "../../rules/min-date-rule";
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
