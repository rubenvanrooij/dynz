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
  EmailRule,
  OneOfRule,
  AfterRule,
  BeforeRule,
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

export function email(code?: string): EmailRule {
  return { type: RuleType.EMAIL, code };
}

export function after<T extends DateString | Reference>(after: T, code?: string): AfterRule<T> {
  return { after, type: RuleType.AFTER, code };
}

export function before<T extends DateString | Reference>(before: T, code?: string): BeforeRule<T> {
  return { before, type: RuleType.BEFORE, code };
}

export function oneOf<T extends ValueOrRef[]>(expexted: T, code?: string): OneOfRule<T> {
  return { type: RuleType.ONE_OF, values: expexted, code };
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
