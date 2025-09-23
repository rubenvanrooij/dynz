import { unpackRefValue } from "../resolve";
import type {
  BaseErrorMessage,
  Condition,
  ConditionalRule,
  CustomRule,
  EmailRule,
  EqualsRule,
  IsNumericRule,
  MaxRule,
  MinRule,
  OneOfRule,
  Reference,
  RegexRule,
  StringSchema,
  Unpacked,
  ValueType,
} from "./../types";
import { type Context, ErrorCode, type ErrorMessage, type Rule, RuleType, type Schema } from "../types";
import { assertNumber } from "../validate";

type ExtractRules<T extends Schema> = Exclude<
  Unpacked<Exclude<T["rules"], undefined>>,
  ConditionalRule<Condition, Rule>
>;
type ErrorMessageForRule<T extends Rule> = T["type"] extends ErrorMessage["code"] ? ErrorMessage : never;

type A = {
  type: "A";
  damn: number;
};

type B = {
  type: "B";
  bar: string;
};

type C = {
  type: "C";
  foo: string;
};

type Types = A | B | C;

type GetType<T extends Types["type"]> = Extract<Types, { type: T }>;

type ValidateRuleContext<T extends Schema, R extends ExtractRules<T> = ExtractRules<T>> = T extends object
  ? {
      // type needs to be here for proper type narrowing
      type: T["type"];
      schema: T;
      path: string;
      rule: R;
      value: ValueType<T["type"]>;
      context: Context;
    }
  : never;

type RuleValidatorFn<TSchema extends Schema, TRule extends ExtractRules<TSchema> = ExtractRules<TSchema>> = (
  context: ValidateRuleContext<TSchema, TRule>
) =>
  | (Omit<Extract<ErrorMessage, { code: TRule["type"] }>, keyof Omit<BaseErrorMessage, "message">> & {
      code: TRule["type"];
    })
  | undefined;

type CombineUnion<T> = {
  [K in T extends object ? keyof T : never]: T extends Record<K, infer V> ? V : never;
};

type RuleValidatorMap<TSchema extends Schema> = CombineUnion<
  Exclude<TSchema["rules"], undefined> extends (infer U)[]
    ? U extends ExtractRules<TSchema>
      ? {
          [P in Exclude<U["type"], typeof RuleType.CONDITIONAL | typeof RuleType.CUSTOM>]: RuleValidatorFn<TSchema, U>;
        }
      : never
    : never
>;

function regexValidator({ rule, value }: ValidateRuleContext<StringSchema, RegexRule>) {
  const regex = new RegExp(rule.regex);
  return regex.test(value)
    ? undefined
    : {
        code: ErrorCode.REGEX,
        regex: rule.regex,
        message: `The value ${value} does not match the regex ${rule.regex}`,
      };
}

function minRule({ rule, value, path, context }: ValidateRuleContext<StringSchema, MinRule<number | Reference>>) {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value.length >= compareTo
    ? undefined
    : {
        code: ErrorCode.MIN,
        min: compareTo,
        message: `The value ${value} for schema ${path} shuld have at least ${compareTo} characters`,
      };
}

function maxRule({ rule, value, path, context }: ValidateRuleContext<StringSchema, MaxRule<number | Reference>>) {
  const max = unpackRefValue(rule.max, path, context);

  if (max === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(max);
  return value.length <= compareTo
    ? undefined
    : {
        code: ErrorCode.MAX,
        max: compareTo,
        message: `The value ${value} for schema ${path} shuld have a maximum of ${compareTo} characters`,
      };
}

function equalsRule({ rule, value, path, context }: ValidateRuleContext<StringSchema, EqualsRule>) {
  const refOrValue = unpackRefValue(rule.value, path, context);
  return refOrValue === value
    ? undefined
    : {
        code: ErrorCode.EQUALS,
        equals: refOrValue,
        message: `The value for schema ${path} does not equal ${refOrValue}`,
      };
}

function isNumericRule({ value }: ValidateRuleContext<StringSchema, IsNumericRule>) {
  return !Number.isNaN(value) && !Number.isNaN(+value)
    ? undefined
    : {
        code: ErrorCode.IS_NUMERIC,
        message: `The value ${value} is not a valid numeric value`,
      };
}

const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-.]*)[a-z0-9_'+-]@([a-z0-9][a-z0-9-]*\.)+[a-z]{2,}$/i;

function emailRule({ value }: ValidateRuleContext<StringSchema, EmailRule>) {
  return EMAIL_REGEX.test(value)
    ? undefined
    : {
        code: ErrorCode.EMAIL,
        message: `The value ${value} is not a valid email address`,
      };
}

function oneOfRule({ value, rule }: ValidateRuleContext<StringSchema, OneOfRule<Array<string | Reference>>>) {
  return rule.values.some((v) => v === value)
    ? undefined
    : {
        code: ErrorCode.ONE_OF,
        expected: rule.values,
        message: `The value ${value} is not a one of ${rule.values}`,
      };
}

const VALIDATORS: RuleValidatorMap<StringSchema> = {
  [RuleType.REGEX]: regexValidator,
  [RuleType.MIN]: minRule,
  [RuleType.MAX]: maxRule,
  [RuleType.EQUALS]: equalsRule,
  [RuleType.IS_NUMERIC]: isNumericRule,
  [RuleType.EMAIL]: emailRule,
  [RuleType.ONE_OF]: oneOfRule,
};

export function getStringValidator({
  type,
}: Exclude<ExtractRules<StringSchema>, CustomRule>): RuleValidatorFn<StringSchema> {
  return VALIDATORS[type] as RuleValidatorFn<StringSchema>;
}
