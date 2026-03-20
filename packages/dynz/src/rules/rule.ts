import type { AfterRule } from "./after-rule";
import type { BeforeRule } from "./before-rule";
import type { ConditionalRule } from "./conditional-rule";
import type { CustomRule } from "./custom-rule";
import type { EmailRule } from "./email-rule";
import type { EqualsRule } from "./equals-rule";
import type { IsNumericRule } from "./is-numeric-rule";
import type { MaxDateRule } from "./max-date-rule";
import type { MaxEntriesRule } from "./max-entries-rule";
import type { MaxLengthRule } from "./max-length-rule";
import type { MaxPrecisionRule } from "./max-precision-rule";
import type { MaxRule } from "./max-rule";
import type { MaxSizeRule } from "./max-size-rule";
import type { MimeTypeRule } from "./mime-type-rule";
import type { MinDateRule } from "./min-date-rule";
import type { MinEntriesRule } from "./min-entries-rule";
import type { MinLengthRule } from "./min-length-rule";
import type { MinRule } from "./min-rule";
import type { MinSizeRule } from "./min-size-rule";
import type { OneOfRule } from "./one-off-rule";
import type { RegexRule } from "./regex-rule";

export type Rule =
  | AfterRule
  | BeforeRule
  | ConditionalRule
  | CustomRule
  | EmailRule
  | EqualsRule
  | IsNumericRule
  | MaxDateRule
  | MaxEntriesRule
  | MaxLengthRule
  | MaxPrecisionRule
  | MaxRule
  | MaxSizeRule
  | MimeTypeRule
  | MinDateRule
  | MinEntriesRule
  | MinLengthRule
  | MinRule
  | MinSizeRule
  | OneOfRule
  | RegexRule;
