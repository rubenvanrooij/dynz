import { customRule } from "../../rules";
import { maxSizeRule } from "../../rules/max-size-rule";
import { mimeTypeRule } from "../../rules/mime-type-rule";
import { minSizeRule } from "../../rules/min-size-rule";
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
