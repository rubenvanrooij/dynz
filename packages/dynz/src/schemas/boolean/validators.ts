import { customRule, equalsRule } from "../../rules";
import type { ValidateRuleContextUnion } from "../../types";
import type { BooleanSchema } from "./types";

export function validateBoolean(context: ValidateRuleContextUnion<BooleanSchema>) {
  switch (context.ruleType) {
    case "equals":
      return equalsRule(context);
    case "custom":
      return customRule(context);
  }
}
