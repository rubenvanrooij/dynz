import { customRule } from "../../shared-rules";
import { maxSizeRule } from "../../shared-rules/max-size-rule";
import { mimeTypeRule } from "../../shared-rules/mime-type-rule";
import { minSizeRule } from "../../shared-rules/min-size-rule";
import type { ValidateRuleContextUnion } from "../../types";
import type { FileSchema } from "./types";

export function validateFile(context: ValidateRuleContextUnion<FileSchema>) {
  switch (context.ruleType) {
    case "min_size":
      return minSizeRule(context);
    case "max_size":
      return maxSizeRule(context);
    case "mime_type":
      return mimeTypeRule(context);
    case "custom":
      return customRule(context);
  }
}
