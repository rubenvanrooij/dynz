import type { ParamaterValue, Predicate } from "../../functions";
import {
  type ConditionalRule,
  type CustomRule,
  conditional,
  custom,
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
import type { JsonRecord } from "../../types";
import { SchemaType } from "../../types";
import { type ToParam, toParamaterValue } from "../shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Append R to the end of the tuple TRules */
type Push<TRules extends Rule[], R extends Rule> = [...TRules, R];

/** Map every element of a rule tuple to ConditionalRule (preserves length) */
type WrapConditionals<T extends Rule[]> = { [K in keyof T]: ConditionalRule };

// ---------------------------------------------------------------------------
// Rule-only builder  (exposed inside `when()` callbacks)
// No property setters — only rule-appending methods.
// ---------------------------------------------------------------------------

export type StrRuleBuilder<TRules extends Rule[]> = {
  readonly type: typeof SchemaType.STRING;
  readonly rules: TRules;

  min: <P extends ParamaterValue<number> | number>(
    min: P,
    code?: string
  ) => StrRuleBuilder<Push<TRules, MinLengthRule<ToParam<P>>>>;
  max: <P extends ParamaterValue<number> | number>(
    max: P,
    code?: string
  ) => StrRuleBuilder<Push<TRules, MaxLengthRule<ToParam<P>>>>;
  regex: <P extends string>(pattern: P, flags?: string, code?: string) => StrRuleBuilder<Push<TRules, RegexRule<P>>>;
  email: (code?: string) => StrRuleBuilder<Push<TRules, EmailRule>>;
  equals: <P extends ParamaterValue<string> | string>(
    value: P,
    code?: string
  ) => StrRuleBuilder<Push<TRules, EqualsRule<ToParam<P>>>>;
  isNumeric: (code?: string) => StrRuleBuilder<Push<TRules, IsNumericRule>>;
  oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => StrRuleBuilder<Push<TRules, OneOfRule<P>>>;
  custom: <T extends Record<string, ParamaterValue>>(
    name: string,
    params?: T,
    code?: string
  ) => StrRuleBuilder<Push<TRules, CustomRule<T>>>;
};

// ---------------------------------------------------------------------------
// Full fluent builder
//
// Two type parameters keep rules and schema properties completely separate,
// so neither side needs Omit/intersection tricks.
//
// TRules  — the accumulated rules as a precise tuple (index-accessible)
// TProps  — the schema property bag (required, mutable, coerce, …)
// ---------------------------------------------------------------------------

export type StrFluent<TRules extends Rule[], TProps> = {
  readonly type: typeof SchemaType.STRING;
  /** Accumulated validation rules for this string */
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    /** Sets minimum string length. @param min - Minimum character count. @param code - Optional error code */
    min: <P extends ParamaterValue<number> | number>(
      min: P,
      code?: string
    ) => StrFluent<Push<TRules, MinLengthRule<ToParam<P>>>, TProps>;
    /** Sets maximum string length. @param max - Maximum character count. @param code - Optional error code */
    max: <P extends ParamaterValue<number> | number>(
      max: P,
      code?: string
    ) => StrFluent<Push<TRules, MaxLengthRule<ToParam<P>>>, TProps>;
    /** Validates string matches a regex pattern. @param pattern - Regex pattern. @param flags - Optional regex flags. @param code - Optional error code */
    regex: <P extends string>(
      pattern: P,
      flags?: string,
      code?: string
    ) => StrFluent<Push<TRules, RegexRule<P>>, TProps>;
    /** Validates string is a valid email address. @param code - Optional error code */
    email: (code?: string) => StrFluent<Push<TRules, EmailRule>, TProps>;
    /** Validates string equals an exact value. @param value - Expected value. @param code - Optional error code */
    equals: <P extends ParamaterValue<string> | string>(
      value: P,
      code?: string
    ) => StrFluent<Push<TRules, EqualsRule<ToParam<P>>>, TProps>;
    /** Validates string contains only numeric characters. @param code - Optional error code */
    isNumeric: (code?: string) => StrFluent<Push<TRules, IsNumericRule>, TProps>;
    /** Validates string is one of allowed values. @param values - Array of allowed values. @param code - Optional error code */
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => StrFluent<Push<TRules, OneOfRule<P>>, TProps>;
    /** Adds a custom validation rule. @param name - Rule name. @param params - Rule parameters. @param code - Optional error code */
    custom: <T extends Record<string, ParamaterValue>>(
      name: string,
      params?: T,
      code?: string
    ) => StrFluent<Push<TRules, CustomRule<T>>, TProps>;

    // — Conditional rules —
    /** Applies rules conditionally based on a predicate. @param pred - Condition to evaluate. @param cb - Builder callback for conditional rules */
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: StrRuleBuilder<[]>) => StrRuleBuilder<WRules>
    ) => StrFluent<[...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    /** Marks field as required or conditionally required. @param value - Boolean or predicate */
    setRequired: <P extends boolean | Predicate>(value: P) => StrFluent<TRules, TProps & { required: P }>;
    /** Marks field as optional (shorthand for setRequired(false)) */
    optional: () => StrFluent<TRules, TProps & { required: false }>;
    /** Controls if field can be modified after creation. @param value - Boolean or predicate */
    setMutable: <P extends boolean | Predicate>(value: P) => StrFluent<TRules, TProps & { mutable: P }>;
    /** Controls if field is included in output. @param value - Boolean or predicate */
    setIncluded: <P extends boolean | Predicate>(value: P) => StrFluent<TRules, TProps & { included: P }>;
    /** Marks field as private (masked in output). @param value - Boolean flag */
    setPrivate: <P extends boolean>(value: P) => StrFluent<TRules, TProps & { private: P }>;
    /** Enables automatic type coercion. @param value - Boolean flag */
    setCoerce: <P extends boolean>(value: P) => StrFluent<TRules, TProps & { coerce: P }>;
    /** Sets a default value when field is empty. @param value - Default string value */
    setDefault: (value: string) => StrFluent<TRules, TProps & { default: string }>;
    /** Attaches UI metadata for form rendering. @param config - UI configuration object */
    setUi: <TUI extends JsonRecord>(config: TUI) => StrFluent<TRules, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factories
// ---------------------------------------------------------------------------

function createRuleBuilder<TRules extends Rule[]>(rules: TRules): StrRuleBuilder<TRules> {
  const push = <R extends Rule>(rule: R): StrRuleBuilder<Push<TRules, R>> =>
    createRuleBuilder([...rules, rule] as Push<TRules, R>);

  return {
    type: SchemaType.STRING,
    rules,
    min: <P extends ParamaterValue<number> | number>(min: P, code?: string) =>
      push(minLength(toParamaterValue(min), code)),
    max: <P extends ParamaterValue<number> | number>(max: P, code?: string) =>
      push(maxLength(toParamaterValue(max), code)),
    regex: <P extends string>(pattern: P, flags?: string, code?: string) => push(regex(pattern, flags, code)),
    email: (code?: string) => push(email(code)),
    equals: <P extends ParamaterValue<string> | string>(value: P, code?: string) =>
      push(equals(toParamaterValue(value), code)),
    isNumeric: (code?: string) => push(isNumeric(code)),
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => push(oneOf(values, code)),
    custom: <T extends Record<string, ParamaterValue>>(name: string, params?: T, code?: string) =>
      // @ts-expect-error - code can be undefined which is handled by the custom() implementation
      push(custom(name, params || ({} as T), code)),
  };
}

function createFluent<TRules extends Rule[], TProps>(rules: TRules, props: TProps): StrFluent<TRules, TProps> {
  const pushRule = <R extends Rule>(rule: R): StrFluent<Push<TRules, R>, TProps> =>
    createFluent([...rules, rule] as Push<TRules, R>, props);

  const setProp = <K extends string, V>(key: K, value: V): StrFluent<TRules, TProps & Record<K, V>> =>
    createFluent(rules, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.STRING,
    rules,
    ...props,

    // — Rule methods —
    min: <P extends ParamaterValue<number> | number>(min: P, code?: string) =>
      pushRule(minLength(toParamaterValue(min), code)),
    max: <P extends ParamaterValue<number> | number>(max: P, code?: string) =>
      pushRule(maxLength(toParamaterValue(max), code)),
    regex: <P extends string>(pattern: P, flags?: string, code?: string) => pushRule(regex(pattern, flags, code)),
    email: (code?: string) => pushRule(email(code)),
    equals: <P extends ParamaterValue<string> | string>(value: P, code?: string) =>
      pushRule(equals(toParamaterValue(value), code)),
    isNumeric: (code?: string) => pushRule(isNumeric(code)),
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => pushRule(oneOf(values, code)),
    custom: <T extends Record<string, ParamaterValue>>(name: string, params?: T, code?: string) =>
      // @ts-expect-error - code can be undefined which is handled by the custom() implementation
      pushRule(custom(name, params || ({} as T), code)),

    // — Conditional rules —
    when: <WRules extends Rule[]>(pred: Predicate, cb: (b: StrRuleBuilder<[]>) => StrRuleBuilder<WRules>) => {
      const result = cb(createRuleBuilder([]));
      const conditionals = result.rules.map((rule) =>
        conditional({
          when: pred,
          then: rule as Exclude<Rule, ConditionalRule>,
        })
      ) as WrapConditionals<WRules>;
      return createFluent([...rules, ...conditionals] as [...TRules, ...WrapConditionals<WRules>], props);
    },

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => setProp("required", value),
    optional: () => setProp("required", false as false),
    setMutable: <P extends boolean | Predicate>(value: P) => setProp("mutable", value),
    setIncluded: <P extends boolean | Predicate>(value: P) => setProp("included", value),
    setPrivate: <P extends boolean>(value: P) => setProp("private", value),
    setCoerce: <P extends boolean>(value: P) => setProp("coerce", value),
    setDefault: (value: string) => setProp("default", value),
    setUi: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as StrFluent<TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Create a new string schema fluent builder.
 *
 * Rules accumulate as a typed tuple so each index is fully typed:
 * ```
 * str().min(val(3)).max(ref('otherField'))
 * //   rules: [MinLengthRule<Static<3>>, MaxLengthRule<Reference<'otherField'>>]
 * //   schema.rules[1].max → Reference<'otherField'>
 * ```
 *
 * Property setters accept both static booleans and predicates:
 * ```
 * str().setRequired(true)
 * str().setRequired(eq(val(3), ref('otherField')))
 * ```
 *
 * `when` restricts the callback builder to rule methods only:
 * ```
 * str().when(eq(val(3), ref('otherField')), (b) => b.min(ref('otherField')))
 * ```
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function string(): StrFluent<[], Record<never, never>> {
  return createFluent([], {} as Record<never, never>);
}
