import type { ParamaterValue, Predicate, Transformer } from "../../functions";
import type { JsonRecord } from "../../types";
import { type ToParam, toParamaterValue } from "../shared";
import {
  type ConditionalRule,
  conditional,
  type EqualsRule,
  equals,
  type IsNumericRule,
  isNumeric,
  type MaxPrecisionRule,
  type MaxRule,
  type MinRule,
  max,
  maxPrecision,
  min,
  type OneOfRule,
  oneOf,
  type Rule,
} from "../../rules";
import { SchemaType } from "../../types";

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

export type NumRuleBuilder<TRules extends Rule[]> = {
  readonly type: typeof SchemaType.NUMBER;
  readonly rules: TRules;

  min: <P extends ParamaterValue<number>, A extends Transformer = Transformer>(
    value: P,
    code?: string,
    transformer?: A
  ) => NumRuleBuilder<Push<TRules, MinRule<P, A>>>;
  max: <P extends ParamaterValue<number>>(value: P, code?: string) => NumRuleBuilder<Push<TRules, MaxRule<P>>>;
  maxPrecision: <P extends ParamaterValue<number>>(
    value: P,
    code?: string
  ) => NumRuleBuilder<Push<TRules, MaxPrecisionRule<P>>>;
  equals: <P extends ParamaterValue<number>>(value: P, code?: string) => NumRuleBuilder<Push<TRules, EqualsRule<P>>>;
  isNumeric: (code?: string) => NumRuleBuilder<Push<TRules, IsNumericRule>>;
  oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => NumRuleBuilder<Push<TRules, OneOfRule<P>>>;
};

// ---------------------------------------------------------------------------
// Full fluent builder
//
// TRules  — the accumulated rules as a precise tuple (index-accessible)
// TProps  — the schema property bag (required, mutable, coerce, …)
// ---------------------------------------------------------------------------

export type NumFluent<TRules extends Rule[], TProps> = {
  readonly type: typeof SchemaType.NUMBER;
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    min: <P extends ParamaterValue<number> | number, A extends Transformer = Transformer>(
      value: P,
      code?: string,
      transformer?: A
    ) => NumFluent<Push<TRules, MinRule<ToParam<P>, A>>, TProps>;
    max: <P extends ParamaterValue<number> | number>(
      value: P,
      code?: string
    ) => NumFluent<Push<TRules, MaxRule<ToParam<P>>>, TProps>;
    maxPrecision: <P extends ParamaterValue<number> | number>(
      value: P,
      code?: string
    ) => NumFluent<Push<TRules, MaxPrecisionRule<ToParam<P>>>, TProps>;
    equals: <P extends ParamaterValue<number> | number>(
      value: P,
      code?: string
    ) => NumFluent<Push<TRules, EqualsRule<ToParam<P>>>, TProps>;
    isNumeric: (code?: string) => NumFluent<Push<TRules, IsNumericRule>, TProps>;
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => NumFluent<Push<TRules, OneOfRule<P>>, TProps>;

    // — Conditional rules —
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: NumRuleBuilder<[]>) => NumRuleBuilder<WRules>
    ) => NumFluent<[...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => NumFluent<TRules, TProps & { required: P }>;
    optional: () => NumFluent<TRules, TProps & { required: false }>;
    setMutable: <P extends boolean | Predicate>(value: P) => NumFluent<TRules, TProps & { mutable: P }>;
    setIncluded: <P extends boolean | Predicate>(value: P) => NumFluent<TRules, TProps & { included: P }>;
    setPrivate: <P extends boolean>(value: P) => NumFluent<TRules, TProps & { private: P }>;
    setCoerce: <P extends boolean>(value: P) => NumFluent<TRules, TProps & { coerce: P }>;
    setDefault: (value: number) => NumFluent<TRules, TProps & { default: number }>;
    ui: <TUI extends JsonRecord>(config: TUI) => NumFluent<TRules, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factories
// ---------------------------------------------------------------------------

function createRuleBuilder<TRules extends Rule[]>(rules: TRules): NumRuleBuilder<TRules> {
  const push = <R extends Rule>(rule: R): NumRuleBuilder<Push<TRules, R>> =>
    createRuleBuilder([...rules, rule] as Push<TRules, R>);

  return {
    type: SchemaType.NUMBER,
    rules,
    min: <P extends ParamaterValue<number>, A extends Transformer = Transformer>(
      value: P,
      code?: string,
      transformer?: A
    ) => push(min(value, code, transformer)),
    max: <P extends ParamaterValue<number>>(value: P, code?: string) => push(max(value, code)),
    maxPrecision: <P extends ParamaterValue<number>>(value: P, code?: string) => push(maxPrecision(value, code)),
    equals: <P extends ParamaterValue<number>>(value: P, code?: string) => push(equals(value, code)),
    isNumeric: (code?: string) => push(isNumeric(code)),
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => push(oneOf(values, code)),
  };
}

function createFluent<TRules extends Rule[], TProps>(rules: TRules, props: TProps): NumFluent<TRules, TProps> {
  const pushRule = <R extends Rule>(rule: R): NumFluent<Push<TRules, R>, TProps> =>
    createFluent([...rules, rule] as Push<TRules, R>, props);

  const setProp = <K extends string, V>(key: K, value: V): NumFluent<TRules, TProps & Record<K, V>> =>
    createFluent(rules, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.NUMBER,
    rules,
    ...props,

    // — Rule methods —
    min: <P extends ParamaterValue<number> | number, A extends Transformer = Transformer>(
      value: P,
      code?: string,
      transformer?: A
    ) => pushRule(min(toParamaterValue(value), code, transformer)),
    max: <P extends ParamaterValue<number> | number>(value: P, code?: string) =>
      pushRule(max(toParamaterValue(value), code)),
    maxPrecision: <P extends ParamaterValue<number> | number>(value: P, code?: string) =>
      pushRule(maxPrecision(toParamaterValue(value), code)),
    equals: <P extends ParamaterValue<number> | number>(value: P, code?: string) =>
      pushRule(equals(toParamaterValue(value), code)),
    isNumeric: (code?: string) => pushRule(isNumeric(code)),
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => pushRule(oneOf(values, code)),

    // — Conditional rules —
    when: <WRules extends Rule[]>(pred: Predicate, cb: (b: NumRuleBuilder<[]>) => NumRuleBuilder<WRules>) => {
      const result = cb(createRuleBuilder([]));
      const conditionals = result.rules.map((rule) =>
        conditional({ when: pred, then: rule as Exclude<Rule, ConditionalRule> })
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
    setDefault: (value: number) => setProp("default", value),
    ui: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as NumFluent<TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function number(): NumFluent<[], Record<never, never>> {
  return createFluent([], {} as Record<never, never>);
}
