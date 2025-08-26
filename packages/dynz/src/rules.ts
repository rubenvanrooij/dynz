import {
  Condition,
  ConditionalRule,
  EqualsRule,
  MaxRule,
  MinRule,
  Reference,
  RegexRule,
  Rule,
  RuleType,
  DateString,
  ValueOrRef,
  IsNumericRule,
  CustomRule,
  MimeTypeRule,
} from './types';

export function rules<T extends Rule[]>(...rules: T): T {
  return rules;
}

export function ref<const T extends string>(path: T): Reference<T> {
  return {
    type: '__reference',
    path,
  };
}

export function min<
  T extends number | DateString | Reference = number | DateString | Reference,
>(min: T, code?: string): MinRule<T> {
  return { type: RuleType.MIN, min, code };
}

export function max<
  T extends number | DateString | Reference = number | DateString | Reference,
>(max: T, code?: string): MaxRule<T> {
  return { type: RuleType.MAX, max, code };
}

export function regex(regex: string, code?: string): RegexRule {
  return { type: RuleType.REGEX, regex, code };
}

export function equals<T extends ValueOrRef>(value: T, code?: string): EqualsRule<T> {
  return { type: RuleType.EQUALS, value, code };
}

export function isNumeric(code?: string): IsNumericRule {
  return { type: RuleType.IS_NUMERIC, code };
}

export function mimeType(mimeType: string | string[], code?: string): MimeTypeRule {
  return { type: RuleType.MIME_TYPE, mimeType, code };
}

export function custom<T extends Record<string, ValueOrRef>>(
  name: string,
): CustomRule;
export function custom<T extends Record<string, ValueOrRef>>(
  name: string,
  params: T,
): CustomRule<T>;
export function custom<T extends Record<string, ValueOrRef>>(
  name: string,
  params?: T,
): CustomRule {
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
