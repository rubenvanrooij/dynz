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
} from './types';

export function rules<T extends Rule>(...rules: T[]): T[] {
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
>(min: T): MinRule<T> {
  return { type: RuleType.MIN, min };
}

export function max<
  T extends number | DateString | Reference = number | DateString | Reference,
>(max: T): MaxRule<T> {
  return { type: RuleType.MAX, max };
}

export function regex(regex: string): RegexRule {
  return { type: RuleType.REGEX, regex };
}

export function equals<T extends ValueOrRef>(value: T): EqualsRule<T> {
  return { type: RuleType.EQUALS, value };
}

export function isNumeric(): IsNumericRule {
  return { type: RuleType.IS_NUMERIC };
}

export function custom<T extends Record<string, ValueOrRef>>(
  name: string,
  params?: T,
): CustomRule {
  return { type: RuleType.CUSTOM, name, params: params || {} };
}

export function conditional<T extends Rule>({
  when,
  then,
}: {
  when: Condition;
  then: Exclude<T, ConditionalRule<never>>;
}): ConditionalRule<T> {
  return { type: RuleType.CONDITIONAL, when, then };
}
