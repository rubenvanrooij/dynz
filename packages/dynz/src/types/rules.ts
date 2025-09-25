import type { Condition } from "../conditions";
import type { Reference, ValueOrReference } from "./reference";
import type { Schema } from "./schema";
import type { EnumValues, Unpacked } from "./utils";

export const RuleType = {
  MIN: "min",
  MAX: "max",
  MIN_LENGTH: "min_length",
  MIN_SIZE: "min_size",
  MIN_DATE: "min_date",
  MIN_ENTRIES: "min_entries",

  MAX_LENGTH: "max_length",
  MAX_SIZE: "max_size",
  MAX_DATE: "max_date",
  MAX_ENTRIES: "max_entries",

  AFTER: "after",
  BEFORE: "before",
  EMAIL: "email",
  ONE_OF: "one_off",
  MIME_TYPE: "mime_type",
  MAX_PRECISION: "max_precision",
  REGEX: "regex",
  EQUALS: "equals",
  CONDITIONAL: "conditional",
  IS_NUMERIC: "is_numeric",
  CUSTOM: "custom",
} as const;

export type RuleType = EnumValues<typeof RuleType>;
export type Default<T, A> = [T] extends [never] ? A : T;

export type IsNumericRule = {
  type: typeof RuleType.IS_NUMERIC;
  code?: string | undefined;
};

export type MinRule<T extends number | Reference = number | Reference> = {
  type: typeof RuleType.MIN;
  min: T;
  code?: string | undefined;
};

export type MinLengthRule<T extends number | Reference = number | Reference> = {
  type: typeof RuleType.MIN_LENGTH;
  min: T;
  code?: string | undefined;
};

export type MinSizeRule<T extends number | Reference = number | Reference> = {
  type: typeof RuleType.MIN_SIZE;
  min: T;
  code?: string | undefined;
};

export type MinEntriesRule<T extends number | Reference = number | Reference> = {
  type: typeof RuleType.MIN_ENTRIES;
  min: T;
  code?: string | undefined;
};

export type MinDateRule<T extends Date | Reference = Date | Reference> = {
  type: typeof RuleType.MIN_DATE;
  min: T;
  code?: string | undefined;
};

export type MaxRule<T extends Date | number | string | Reference = Date | number | string | Reference> = {
  type: typeof RuleType.MAX;
  max: T;
  code?: string | undefined;
};

export type MaxEntriesRule<T extends number | Reference = number | Reference> = {
  type: typeof RuleType.MAX_ENTRIES;
  max: T;
  code?: string | undefined;
};

export type MaxLengthRule<T extends number | Reference = number | Reference> = {
  type: typeof RuleType.MAX_LENGTH;
  max: T;
  code?: string | undefined;
};

export type MaxSizeRule<T extends number | Reference = number | Reference> = {
  type: typeof RuleType.MAX_SIZE;
  max: T;
  code?: string | undefined;
};

export type MaxDateRule<T extends Date | Reference = Date | Reference> = {
  type: typeof RuleType.MAX_DATE;
  max: T;
  code?: string | undefined;
};

export type MaxPrecisionRule<T extends number | Reference = number | Reference> = {
  type: typeof RuleType.MAX_PRECISION;
  max: T;
  code?: string | undefined;
};

export type EqualsRule<T extends ValueOrReference = ValueOrReference> = {
  type: typeof RuleType.EQUALS;
  value: T;
  code?: string | undefined;
};

export type EmailRule = {
  type: typeof RuleType.EMAIL;
  code?: string | undefined;
};

export type OneOfRule<T extends ValueOrReference[] = ValueOrReference[]> = {
  type: typeof RuleType.ONE_OF;
  values: T;
  code?: string | undefined;
};

export type RegexRule = {
  type: typeof RuleType.REGEX;
  regex: string;
  code?: string | undefined;
};

export type BeforeRule<T extends Date | string | Reference = Date | string | Reference> = {
  type: typeof RuleType.BEFORE;
  before: T;
  code?: string | undefined;
};

export type AfterRule<T extends Date | string | Reference = Date | string | Reference> = {
  type: typeof RuleType.AFTER;
  after: T;
  code?: string | undefined;
};

export type MimeTypeRule = {
  type: typeof RuleType.MIME_TYPE;
  mimeType: ValueOrReference<string[] | string>;
  code?: string | undefined;
};

export type CustomRule<T extends Record<string, ValueOrReference> = Record<string, ValueOrReference>> = {
  type: typeof RuleType.CUSTOM;
  name: string;
  params: T;
  code?: string | undefined;
};

export type ConditionalRule<TCondition, TRule extends Rule> = {
  type: typeof RuleType.CONDITIONAL;
  when: [TCondition] extends [never] ? Condition : TCondition;
  then: Exclude<[TRule] extends [never] ? Rule : TRule, ConditionalRule<never, never>>;
  code?: string | undefined;
};

export type Rule =
  | ConditionalRule<never, never>
  | MinRule
  | MinSizeRule
  | MinDateRule
  | MinLengthRule
  | MinEntriesRule
  | MaxRule
  | MaxSizeRule
  | MaxEntriesRule
  | MaxDateRule
  | MaxLengthRule
  | EqualsRule
  | RegexRule
  | MaxPrecisionRule
  | IsNumericRule
  | CustomRule
  | MimeTypeRule
  | OneOfRule
  | EmailRule
  | BeforeRule
  | AfterRule;

export type ExtractRules<T extends Schema> = Unpacked<Exclude<T["rules"], undefined>>;

export type ResolvedRules<T extends Rule = Rule> = Exclude<T, ConditionalRule<Condition, Rule>>;

export type ExtractResolvedRules<T extends Schema> = ResolvedRules<ExtractRules<T>>;
