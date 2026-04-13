import type { ParamaterValue, Predicate } from "../../functions";
import type { JsonRecord } from "../../types";
import { type ToParam, toParamaterValue } from "../shared";
import {
  type ConditionalRule,
  conditional,
  type EqualsRule,
  equals,
  type OneOfRule,
  oneOf,
  type Rule,
} from "../../rules";
import { SchemaType } from "../../types";
import type { Enum, EnumValues } from "./types";

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

export type EnumRuleBuilder<TEnum extends Enum, TRules extends Rule[]> = {
  readonly type: typeof SchemaType.ENUM;
  readonly enum: TEnum;
  readonly rules: TRules;

  equals: <P extends ParamaterValue<EnumValues<TEnum>>>(
    value: P,
    code?: string
  ) => EnumRuleBuilder<TEnum, Push<TRules, EqualsRule<P>>>;
  oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => EnumRuleBuilder<TEnum, Push<TRules, OneOfRule<P>>>;
};

// ---------------------------------------------------------------------------
// Full fluent builder
//
// TEnum   — the enum type (carried so the schema data stays complete)
// TRules  — the accumulated rules as a precise tuple (index-accessible)
// TProps  — the schema property bag (required, mutable, …)
// ---------------------------------------------------------------------------

export type EnumFluent<TEnum extends Enum, TRules extends Rule[], TProps> = {
  readonly type: typeof SchemaType.ENUM;
  readonly enum: TEnum;
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    equals: <P extends ParamaterValue<EnumValues<TEnum>> | EnumValues<TEnum>>(
      value: P,
      code?: string
    ) => EnumFluent<TEnum, Push<TRules, EqualsRule<ToParam<P>>>, TProps>;
    oneOf: <P extends ParamaterValue[]>(
      values: P,
      code?: string
    ) => EnumFluent<TEnum, Push<TRules, OneOfRule<P>>, TProps>;

    // — Conditional rules —
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: EnumRuleBuilder<TEnum, []>) => EnumRuleBuilder<TEnum, WRules>
    ) => EnumFluent<TEnum, [...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => EnumFluent<TEnum, TRules, TProps & { required: P }>;
    optional: () => EnumFluent<TEnum, TRules, TProps & { required: false }>;
    setMutable: <P extends boolean | Predicate>(value: P) => EnumFluent<TEnum, TRules, TProps & { mutable: P }>;
    setIncluded: <P extends boolean | Predicate>(value: P) => EnumFluent<TEnum, TRules, TProps & { included: P }>;
    setPrivate: <P extends boolean>(value: P) => EnumFluent<TEnum, TRules, TProps & { private: P }>;
    setDefault: (value: EnumValues<TEnum>) => EnumFluent<TEnum, TRules, TProps & { default: EnumValues<TEnum> }>;
    ui: <TUI extends JsonRecord>(config: TUI) => EnumFluent<TEnum, TRules, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factories
// ---------------------------------------------------------------------------

function createRuleBuilder<TEnum extends Enum, TRules extends Rule[]>(
  theEnum: TEnum,
  rules: TRules
): EnumRuleBuilder<TEnum, TRules> {
  const push = <R extends Rule>(rule: R): EnumRuleBuilder<TEnum, Push<TRules, R>> =>
    createRuleBuilder(theEnum, [...rules, rule] as Push<TRules, R>);

  return {
    type: SchemaType.ENUM,
    enum: theEnum,
    rules,
    equals: <P extends ParamaterValue<EnumValues<TEnum>>>(value: P, code?: string) => push(equals(value, code)),
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => push(oneOf(values, code)),
  };
}

function createFluent<TEnum extends Enum, TRules extends Rule[], TProps>(
  theEnum: TEnum,
  rules: TRules,
  props: TProps
): EnumFluent<TEnum, TRules, TProps> {
  const pushRule = <R extends Rule>(rule: R): EnumFluent<TEnum, Push<TRules, R>, TProps> =>
    createFluent(theEnum, [...rules, rule] as Push<TRules, R>, props);

  const setProp = <K extends string, V>(key: K, value: V): EnumFluent<TEnum, TRules, TProps & Record<K, V>> =>
    createFluent(theEnum, rules, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.ENUM,
    enum: theEnum,
    rules,
    ...props,

    // — Rule methods —
    equals: <P extends ParamaterValue<EnumValues<TEnum>> | EnumValues<TEnum>>(value: P, code?: string) =>
      pushRule(equals(toParamaterValue(value), code)),
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => pushRule(oneOf(values, code)),

    // — Conditional rules —
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: EnumRuleBuilder<TEnum, []>) => EnumRuleBuilder<TEnum, WRules>
    ) => {
      const result = cb(createRuleBuilder(theEnum, []));
      const conditionals = result.rules.map((rule) =>
        conditional({ when: pred, then: rule as Exclude<Rule, ConditionalRule> })
      ) as WrapConditionals<WRules>;
      return createFluent(theEnum, [...rules, ...conditionals] as [...TRules, ...WrapConditionals<WRules>], props);
    },

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => setProp("required", value),
    optional: () => setProp("required", false as false),
    setMutable: <P extends boolean | Predicate>(value: P) => setProp("mutable", value),
    setIncluded: <P extends boolean | Predicate>(value: P) => setProp("included", value),
    setPrivate: <P extends boolean>(value: P) => setProp("private", value),
    setDefault: (value: EnumValues<TEnum>) => setProp("default", value),
    ui: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as EnumFluent<TEnum, TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function _enum<const TEnum extends Enum>(theEnum: TEnum): EnumFluent<TEnum, [], Record<never, never>> {
  return createFluent(theEnum, [], {} as Record<never, never>);
}

export type { _enum as enum };
