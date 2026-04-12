import type { ParamaterValue, Predicate } from "../../functions";
import {
  type ConditionalRule,
  conditional,
  type EmailRule,
  type EqualsRule,
  email,
  equals,
  type IsNumericRule,
  isNumeric,
  type MaxLengthRule,
  type MinLengthRule,
  maxLength,
  minLength,
  type OneOfRule,
  oneOf,
  type RegexRule,
  type Rule,
  regex,
} from "../../rules";
import { SchemaType } from "../../types";
import type { StringSchema } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Append<TRules extends Rule[] | undefined, R extends Rule> = TRules extends readonly Rule[] ? [...TRules, R] : [R];

type WithChanged<T, K extends keyof T, V> = Omit<T, K> & Record<K, V>;

// ---------------------------------------------------------------------------
// Public builder type
// ---------------------------------------------------------------------------

type AddRule<TSchema extends StringSchema, TRule extends Rule> = WithChanged<
  TSchema,
  "rules",
  Append<TSchema["rules"], TRule>
>;

type WrapRules<TRules extends Rule[]> = TRules extends [infer _H extends Rule, ...infer Tail extends Rule[]]
  ? [ConditionalRule, ...WrapRules<Tail>]
  : [];

type AppendAll<TSchema extends StringSchema, TNewRules extends Rule[]> = TNewRules extends [
  infer H extends Rule,
  ...infer Tail extends Rule[],
]
  ? AppendAll<AddRule<TSchema, H>, Tail>
  : TSchema;

type AddConditionalRules<
  TSchema extends StringSchema,
  TCallbackRules extends Rule[] | undefined,
> = TCallbackRules extends Rule[] ? AppendAll<TSchema, WrapRules<TCallbackRules>> : TSchema;

/**
 * Fluent string schema builder.
 * TBase holds all non-rules schema properties; TRules is the accumulated rule tuple.
 */
export type StringFluent<T extends StringSchema> = T & {
  minLength: <P extends ParamaterValue<number>>(min: P, code: string) => StringFluent<AddRule<T, MinLengthRule<P>>>;
  maxLength: <P extends ParamaterValue<number>>(max: P, code?: string) => StringFluent<AddRule<T, MaxLengthRule<P>>>;
  regex: <P extends string>(pattern: P, flags?: string, code?: string) => StringFluent<AddRule<T, RegexRule<P>>>;
  email: (code?: string) => StringFluent<AddRule<T, EmailRule>>;
  equals: <P extends ParamaterValue>(value: P, code?: string) => StringFluent<AddRule<T, EqualsRule<P>>>;
  isNumeric: (code?: string) => StringFluent<AddRule<T, IsNumericRule>>;
  oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => StringFluent<AddRule<T, OneOfRule<P>>>;

  when: <B extends StringFluent<StringSchema>>(
    pred: Predicate,
    cb: (b: StringFluent<{ type: typeof SchemaType.STRING; rules: undefined }>) => B
  ) => StringFluent<AddConditionalRules<T, B["rules"]>>;

  setRequired: <P extends boolean | Predicate>(value: P) => StringFluent<T & { required: P }>;
  optional: () => StringFluent<T & { required: false }>;
  setDefault: (value: string) => StringFluent<T & { default: string }>;
  setCoerce: <P extends boolean>(value: P) => StringFluent<T & { coerce: boolean }>;
  setPrivate: <P extends boolean>(value: P) => StringFluent<T & { private: boolean }>;
  setMutable: <P extends boolean | Predicate>(value: P) => StringFluent<T & { mutable: boolean | Predicate }>;
  setIncluded: <P extends boolean | Predicate>(value: P) => StringFluent<T & { included: boolean | Predicate }>;
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

function appendRule<A extends Rule[] | undefined, F extends Rule>(rules: A, rule: F): Append<A, F> {
  return (rules === undefined ? [rule] : [...rules, rule]) as Append<A, F>;
}

function createStringFluent<T extends StringSchema>(data: T): StringFluent<T> {
  // // biome-ignore lint/suspicious/noExplicitAny: used in type inference
  // const withRule = <A extends (...args: any) => Rule>(builder: A) => {
  //   return (...params: Parameters<A>) => {
  //     const rule = builder(...params) as ReturnType<A>;
  //     type NewRules = TRules extends readonly Rule[] ? [...TRules, ReturnType<A>] : [ReturnType<A>];
  //     const newRules = (rulesArg === undefined ? [rule] : [...rulesArg, rule]) as NewRules;

  //     return createStringFluent(base, newRules);
  //   };
  // };

  const withProps = <P extends Partial<StringSchema>>(props: P) => {
    return createStringFluent({ ...data, ...props }) as StringFluent<T & P>;
  };

  return {
    ...data,
    minLength: <P extends ParamaterValue<number>>(min: P, code?: string) => {
      return createStringFluent({ ...data, rules: appendRule(data.rules, minLength(min, code)) }) as StringFluent<
        AddRule<T, MinLengthRule<P>>
      >;
    },
    maxLength: <P extends ParamaterValue<number>>(max: P, code?: string) => {
      return createStringFluent({ ...data, rules: appendRule(data.rules, maxLength(max, code)) }) as StringFluent<
        AddRule<T, MaxLengthRule<P>>
      >;
    },
    regex: <P extends string>(pattern: P, flags?: string, code?: string) => {
      return createStringFluent({
        ...data,
        rules: appendRule(data.rules, regex(pattern, flags, code)),
      }) as StringFluent<AddRule<T, RegexRule<P>>>;
    },
    email: (code?: string) => {
      return createStringFluent({ ...data, rules: appendRule(data.rules, email(code)) }) as StringFluent<
        AddRule<T, EmailRule>
      >;
    },
    equals: <P extends ParamaterValue>(value: P, code?: string) => {
      return createStringFluent({ ...data, rules: appendRule(data.rules, equals(value, code)) }) as StringFluent<
        AddRule<T, EqualsRule<P>>
      >;
    },
    isNumeric: (code?: string) => {
      return createStringFluent({ ...data, rules: appendRule(data.rules, isNumeric(code)) }) as StringFluent<
        AddRule<T, IsNumericRule>
      >;
    },
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => {
      return createStringFluent({ ...data, rules: appendRule(data.rules, oneOf(values, code)) }) as StringFluent<
        AddRule<T, OneOfRule<P>>
      >;
    },
    when: <B extends StringFluent<StringSchema>>(
      pred: Predicate,
      cb: (b: StringFluent<{ type: typeof SchemaType.STRING; rules: undefined }>) => B
    ) => {
      const result = cb(createStringFluent({ type: SchemaType.STRING, rules: undefined }));
      const newRules = (result.rules ?? []).map((rule) =>
        conditional({ when: pred, then: rule as Exclude<Rule, ConditionalRule> })
      );
      return createStringFluent({
        ...data,
        rules: [...(data.rules ?? []), ...newRules],
      }) as StringFluent<AddConditionalRules<T, B["rules"]>>;
    },
    setRequired: <P extends boolean | Predicate>(value: P) => withProps({ required: value }),
    optional: () => withProps({ required: false }),
    setDefault: (value: string) => withProps({ default: value }),
    setCoerce: <P extends boolean>(value: P) => withProps({ coerce: value }),
    setPrivate: <P extends boolean>(value: P) => withProps({ private: value }),
    setMutable: <P extends boolean | Predicate>(value: P) => withProps({ mutable: value }),
    setIncluded: <P extends boolean | Predicate>(value: P) => withProps({ included: value }),
  };
}

export function str<T extends Omit<StringSchema, "type">>(data: T) {
  return createStringFluent({ type: SchemaType.STRING, ...data });
}
