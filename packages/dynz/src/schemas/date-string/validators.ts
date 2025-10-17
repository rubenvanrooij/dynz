import {
  afterDateStringRule,
  beforeDateStringRule,
  customRule,
  equalsDateStringRule,
  maxDateStringRule,
  minDateStringRule,
} from "../../rules";
import type { ValidateRuleContextUnion } from "../../types";
import type { DateStringSchema } from "./types";

export function validateDateString(context: ValidateRuleContextUnion<DateStringSchema>) {
  switch (context.ruleType) {
    case "equals":
      return equalsDateStringRule(context);
    case "before":
      return beforeDateStringRule(context);
    case "after":
      return afterDateStringRule(context);
    case "min_date":
      return minDateStringRule(context);
    case "max_date":
      return maxDateStringRule(context);
    case "custom":
      return customRule(context);
  }
}
