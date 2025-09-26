import { customRule } from "../../rules";
import { maxLengthRule } from "../../rules/max-length-rule";
import { minLengthRule } from "../../rules/min-length-rule";
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
