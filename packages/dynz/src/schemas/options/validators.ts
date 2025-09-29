import { customRule, equalsRule } from "../../rules";
import type { ValidateRuleContextUnion } from "../../types";
import type { OptionsSchema } from "./types";

export function validateOptions(context: ValidateRuleContextUnion<OptionsSchema>) {
  switch (context.ruleType) {
    case "equals":
      return equalsRule(context);
    case "custom":
      return customRule(context);
  }
}
