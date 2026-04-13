import type { ParamaterValue, Predicate } from "../../functions";
import type { JsonRecord } from "../../types";
import { type ToParam, toParamaterValue } from "../shared";
import {
  type AfterRule,
  after,
  type BeforeRule,
  before,
  type ConditionalRule,
  conditional,
  type MaxDateRule,
  type MinDateRule,
  maxDate,
  minDate,
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

export type DateRuleBuilder<TRules extends Rule[]> = {
  readonly type: typeof SchemaType.DATE;
  readonly rules: TRules;

  after: <P extends ParamaterValue<Date>>(date: P, code?: string) => DateRuleBuilder<Push<TRules, AfterRule<P>>>;
  before: <P extends ParamaterValue<Date>>(date: P, code?: string) => DateRuleBuilder<Push<TRules, BeforeRule<P>>>;
  min: <P extends ParamaterValue<Date>>(date: P, code?: string) => DateRuleBuilder<Push<TRules, MinDateRule<P>>>;
  max: <P extends ParamaterValue<Date>>(date: P, code?: string) => DateRuleBuilder<Push<TRules, MaxDateRule<P>>>;
};

// ---------------------------------------------------------------------------
// Full fluent builder
//
// TRules  — the accumulated rules as a precise tuple (index-accessible)
// TProps  — the schema property bag (required, mutable, coerce, …)
// ---------------------------------------------------------------------------

export type DateFluent<TRules extends Rule[], TProps> = {
  readonly type: typeof SchemaType.DATE;
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    after: <P extends ParamaterValue<Date> | Date>(
      date: P,
      code?: string
    ) => DateFluent<Push<TRules, AfterRule<ToParam<P>>>, TProps>;
    before: <P extends ParamaterValue<Date> | Date>(
      date: P,
      code?: string
    ) => DateFluent<Push<TRules, BeforeRule<ToParam<P>>>, TProps>;
    min: <P extends ParamaterValue<Date> | Date>(
      date: P,
      code?: string
    ) => DateFluent<Push<TRules, MinDateRule<ToParam<P>>>, TProps>;
    max: <P extends ParamaterValue<Date> | Date>(
      date: P,
      code?: string
    ) => DateFluent<Push<TRules, MaxDateRule<ToParam<P>>>, TProps>;

    // — Conditional rules —
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: DateRuleBuilder<[]>) => DateRuleBuilder<WRules>
    ) => DateFluent<[...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => DateFluent<TRules, TProps & { required: P }>;
    optional: () => DateFluent<TRules, TProps & { required: false }>;
    setMutable: <P extends boolean | Predicate>(value: P) => DateFluent<TRules, TProps & { mutable: P }>;
    setIncluded: <P extends boolean | Predicate>(value: P) => DateFluent<TRules, TProps & { included: P }>;
    setPrivate: <P extends boolean>(value: P) => DateFluent<TRules, TProps & { private: P }>;
    setCoerce: <P extends boolean>(value: P) => DateFluent<TRules, TProps & { coerce: P }>;
    setDefault: (value: Date) => DateFluent<TRules, TProps & { default: Date }>;
    ui: <TUI extends JsonRecord>(config: TUI) => DateFluent<TRules, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factories
// ---------------------------------------------------------------------------

function createRuleBuilder<TRules extends Rule[]>(rules: TRules): DateRuleBuilder<TRules> {
  const push = <R extends Rule>(rule: R): DateRuleBuilder<Push<TRules, R>> =>
    createRuleBuilder([...rules, rule] as Push<TRules, R>);

  return {
    type: SchemaType.DATE,
    rules,
    after: <P extends ParamaterValue<Date>>(date: P, code?: string) => push(after(date, code)),
    before: <P extends ParamaterValue<Date>>(date: P, code?: string) => push(before(date, code)),
    min: <P extends ParamaterValue<Date>>(date: P, code?: string) => push(minDate(date, code)),
    max: <P extends ParamaterValue<Date>>(date: P, code?: string) => push(maxDate(date, code)),
  };
}

function createFluent<TRules extends Rule[], TProps>(rules: TRules, props: TProps): DateFluent<TRules, TProps> {
  const pushRule = <R extends Rule>(rule: R): DateFluent<Push<TRules, R>, TProps> =>
    createFluent([...rules, rule] as Push<TRules, R>, props);

  const setProp = <K extends string, V>(key: K, value: V): DateFluent<TRules, TProps & Record<K, V>> =>
    createFluent(rules, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.DATE,
    rules,
    ...props,

    // — Rule methods —
    after: <P extends ParamaterValue<Date> | Date>(date: P, code?: string) =>
      pushRule(after(toParamaterValue(date), code)),
    before: <P extends ParamaterValue<Date> | Date>(date: P, code?: string) =>
      pushRule(before(toParamaterValue(date), code)),
    min: <P extends ParamaterValue<Date> | Date>(date: P, code?: string) =>
      pushRule(minDate(toParamaterValue(date), code)),
    max: <P extends ParamaterValue<Date> | Date>(date: P, code?: string) =>
      pushRule(maxDate(toParamaterValue(date), code)),

    // — Conditional rules —
    when: <WRules extends Rule[]>(pred: Predicate, cb: (b: DateRuleBuilder<[]>) => DateRuleBuilder<WRules>) => {
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
    setDefault: (value: Date) => setProp("default", value),
    ui: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as DateFluent<TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function date(): DateFluent<[], Record<never, never>> {
  return createFluent([], {} as Record<never, never>);
}
