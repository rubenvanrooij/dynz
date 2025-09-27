import { customRule, maxLengthRule, minLengthRule } from "../../rules";
import type { ValidateRuleContextUnion } from "../../types";
import type { ArraySchema } from "./types";

export function validateArray(context: ValidateRuleContextUnion<ArraySchema<never>>) {
  switch (context.ruleType) {
    case "min_length":
      return minLengthRule(context);
    case "max_length":
      return maxLengthRule(context);
    case "custom":
      return customRule(context);
  }
}
