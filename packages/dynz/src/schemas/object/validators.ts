import { customRule, maxEntriesRule, minEntriesRule } from "../../rules";
import type { ValidateRuleContextUnion } from "../../types";
import type { ObjectSchema } from "./types";

export function validateObject(context: ValidateRuleContextUnion<ObjectSchema<never>>) {
  switch (context.ruleType) {
    case "min_entries":
      return minEntriesRule(context);
    case "max_entries":
      return maxEntriesRule(context);
    case "custom":
      return customRule(context);
  }
}
