import { equalsRule } from "../../rules";
import type { ValidateRuleContextUnion } from "../../types";
import type { EnumSchema } from "./types";

export function validateEnum(context: ValidateRuleContextUnion<EnumSchema>) {
  switch (context.ruleType) {
    case "equals":
      return equalsRule(context);
  }
}
