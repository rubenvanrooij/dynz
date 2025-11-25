import { customRule, equalsRule, maxPrecisionRule, maxRule, minRule, oneOfRule } from "../../rules";
import type { ValidateRuleContextUnion } from "../../types";
import type { NumberSchema } from "./types";

export function validateNumber(context: ValidateRuleContextUnion<NumberSchema>) {
  switch (context.ruleType) {
    case "min":
      return minRule(context);
    case "max":
      return maxRule(context);
    case "equals":
      return equalsRule(context);
    case "max_precision":
      return maxPrecisionRule(context);
    case "one_of":
      return oneOfRule(context);
    case "custom":
      return customRule(context);
  }
}
