import { customRule } from "../../shared-rules";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import { maxRule } from "./rules/max-rule";
import { mimeTypeRule } from "./rules/mime-type-rule";
import { minRule } from "./rules/min-rule";
import type { FileSchema } from "./types";

export function validateFile(context: ValidateRuleContextUnion<FileSchema>) {
  switch (context.ruleType) {
    case RuleType.MIN:
      return minRule(context);
    case RuleType.MAX:
      return maxRule(context);
    case RuleType.MIME_TYPE:
      return mimeTypeRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
