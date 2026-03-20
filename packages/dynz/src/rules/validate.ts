import type { Schema, ValidateRuleContextUnion } from "../types";
import { afterRule } from "./after-rule";
import { beforeRule } from "./before-rule";
import { customRule } from "./custom-rule";
import { emailRule } from "./email-rule";
import { equalsRule } from "./equals-rule";
import { isNumericRule } from "./is-numeric-rule";
import { maxDateRule } from "./max-date-rule";
import { maxEntriesRule } from "./max-entries-rule";
import { maxLengthRule } from "./max-length-rule";
import { maxPrecisionRule } from "./max-precision-rule";
import { maxRule } from "./max-rule";
import { maxSizeRule } from "./max-size-rule";
import { mimeTypeRule } from "./mime-type-rule";
import { minDateRule } from "./min-date-rule";
import { minEntriesRule } from "./min-entries-rule";
import { minLengthRule } from "./min-length-rule";
import { minRule } from "./min-rule";
import { minSizeRule } from "./min-size-rule";
import { oneOfRule } from "./one-off-rule";
import { regexRule } from "./regex-rule";

export function validateRule(context: ValidateRuleContextUnion<Schema>) {
  switch (context.ruleType) {
    case "after":
      return afterRule(context);
    case "before":
      return beforeRule(context);
    case "custom":
      return customRule(context);
    case "email":
      return emailRule(context);
    case "equals":
      return equalsRule(context);
    case "is_numeric":
      return isNumericRule(context);
    case "max_date":
      return maxDateRule(context);
    case "max_entries":
      return maxEntriesRule(context);
    case "max_length":
      return maxLengthRule(context);
    case "max_precision":
      return maxPrecisionRule(context);
    case "max":
      return maxRule(context);
    case "max_size":
      return maxSizeRule(context);
    case "mime_type":
      return mimeTypeRule(context);
    case "min_date":
      return minDateRule(context);
    case "min_entries":
      return minEntriesRule(context);
    case "min_length":
      return minLengthRule(context);
    case "min":
      return minRule(context);
    case "min_size":
      return minSizeRule(context);
    case "one_of":
      return oneOfRule(context);
    case "regex":
      return regexRule(context);
  }
}
