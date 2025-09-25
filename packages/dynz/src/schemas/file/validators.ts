import { customRule } from "../../shared-rules";
import { maxSizeRule } from "../../shared-rules/max-size-rule";
import { mimeTypeRule } from "../../shared-rules/mime-type-rule";
import { minSizeRule } from "../../shared-rules/min-size-rule";
import type { ValidateRuleContextUnion } from "../../types";
import { RuleType } from "../../types";
import type { FileSchema } from "./types";

export function validateFile(context: ValidateRuleContextUnion<FileSchema>) {
  switch (context.ruleType) {
    case RuleType.MIN_SIZE:
      return minSizeRule(context);
    case RuleType.MAX_SIZE:
      return maxSizeRule(context);
    case RuleType.MIME_TYPE:
      return mimeTypeRule(context);
    case RuleType.CUSTOM:
      return customRule(context);
  }
}
