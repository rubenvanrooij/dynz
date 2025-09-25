import type { Condition } from "./conditions";
import {
  type AfterRule,
  type BeforeRule,
  type ConditionalRule,
  type CustomRule,
  type DateString,
  type EmailRule,
  type EqualsRule,
  type IsNumericRule,
  type MaxDateRule,
  type MaxEntriesRule,
  type MaxLengthRule,
  type MaxPrecisionRule,
  type MaxRule,
  type MaxSizeRule,
  type MimeTypeRule,
  type MinDateRule,
  type MinEntriesRule,
  type MinLengthRule,
  type MinRule,
  type MinSizeRule,
  type OneOfRule,
  REFERENCE_TYPE,
  type Reference,
  type RegexRule,
  type Rule,
  RuleType,
  type ValueOrReference,
} from "./types";

export function rules<T extends Rule[]>(...rules: T): T {
  return rules;
}

export function ref<const T extends string>(path: T): Reference<T> {
  return {
    _type: REFERENCE_TYPE,
    path,
  };
}

export function min<T extends number | Reference>(min: T, code?: string): MinRule<T> {
  return { type: RuleType.MIN, min, code };
}

export function max<T extends number | Reference>(max: T, code?: string): MaxRule<T> {
  return { type: RuleType.MAX, max, code };
}

export function minLength<T extends number | Reference>(min: T, code?: string): MinLengthRule<T> {
  return { type: RuleType.MIN_LENGTH, min, code };
}

export function maxLength<T extends number | Reference>(max: T, code?: string): MaxLengthRule<T> {
  return { type: RuleType.MAX_LENGTH, max, code };
}

export function minEntries<T extends number | Reference>(min: T, code?: string): MinEntriesRule<T> {
  return { type: RuleType.MIN_ENTRIES, min, code };
}

export function maxEntries<T extends number | Reference>(max: T, code?: string): MaxEntriesRule<T> {
  return { type: RuleType.MAX_ENTRIES, max, code };
}

export function minDate<T extends Date | Reference>(min: T, code?: string): MinDateRule<T> {
  return { type: RuleType.MIN_DATE, min, code };
}

export function maxDate<T extends Date | Reference>(max: T, code?: string): MaxDateRule<T> {
  return { type: RuleType.MAX_DATE, max, code };
}

export function minSize<T extends number | Reference>(min: T, code?: string): MinSizeRule<T> {
  return { type: RuleType.MIN_SIZE, min, code };
}

export function maxSize<T extends number | Reference>(max: T, code?: string): MaxSizeRule<T> {
  return { type: RuleType.MAX_SIZE, max, code };
}

export function maxPrecision<T extends number | Reference>(max: T, code?: string): MaxPrecisionRule<T> {
  return { type: RuleType.MAX_PRECISION, max, code };
}

export function regex(regex: string, code?: string): RegexRule {
  return { type: RuleType.REGEX, regex, code };
}

export function equals<T extends ValueOrReference>(value: T, code?: string): EqualsRule<T> {
  return { type: RuleType.EQUALS, value, code };
}

export function isNumeric(code?: string): IsNumericRule {
  return { type: RuleType.IS_NUMERIC, code };
}

export function mimeType(mimeType: string | string[], code?: string): MimeTypeRule {
  return { type: RuleType.MIME_TYPE, mimeType, code };
}

export function email(code?: string): EmailRule {
  return { type: RuleType.EMAIL, code };
}

export function after<T extends Date | DateString | Reference>(after: T, code?: string): AfterRule<T> {
  return { after, type: RuleType.AFTER, code };
}

export function before<T extends Date | DateString | Reference>(before: T, code?: string): BeforeRule<T> {
  return { before, type: RuleType.BEFORE, code };
}

export function oneOf<T extends ValueOrReference[]>(expexted: T, code?: string): OneOfRule<T> {
  return { type: RuleType.ONE_OF, values: expexted, code };
}

export function custom(name: string): CustomRule;
export function custom<T extends Record<string, ValueOrReference>>(name: string, params: T): CustomRule<T>;
export function custom<T extends Record<string, ValueOrReference>>(name: string, params?: T): CustomRule {
  return { type: RuleType.CUSTOM, name, params: params || {} };
}

export function conditional<A extends Condition, T extends Rule>({
  when,
  then,
}: {
  when: A;
  then: Exclude<T, ConditionalRule<never, never>>;
}): ConditionalRule<A, T> {
  return { type: RuleType.CONDITIONAL, when, then };
}
