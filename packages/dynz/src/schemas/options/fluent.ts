import type { ParamaterValue, Predicate } from "../../functions";
import {
  type ConditionalRule,
  conditional,
  type EqualsRule,
  equals,
  type OneOfRule,
  oneOf,
  type Rule,
} from "../../rules";
import type { JsonRecord } from "../../types";
import { SchemaType } from "../../types";
import { type ToParam, toParamaterValue } from "../shared";
import type { OptionsValue } from "./types";

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

export type OptionsRuleBuilder<TOptions extends OptionsValue, TRules extends Rule[]> = {
  readonly type: typeof SchemaType.OPTIONS;
  readonly options: TOptions;
  readonly rules: TRules;

  equals: <P extends ParamaterValue>(
    value: P,
    code?: string
  ) => OptionsRuleBuilder<TOptions, Push<TRules, EqualsRule<P>>>;
  oneOf: <P extends ParamaterValue[]>(
    values: P,
    code?: string
  ) => OptionsRuleBuilder<TOptions, Push<TRules, OneOfRule<P>>>;
};

// ---------------------------------------------------------------------------
// Full fluent builder
//
// TOptions — the options array type (carried so the schema data stays complete)
// TRules   — the accumulated rules as a precise tuple (index-accessible)
// TProps   — the schema property bag (required, mutable, …)
// ---------------------------------------------------------------------------

export type OptionsFluent<TOptions extends OptionsValue, TRules extends Rule[], TProps> = {
  readonly type: typeof SchemaType.OPTIONS;
  /** Array of selectable options with label/value pairs */
  readonly options: TOptions;
  /** Accumulated validation rules for this options field */
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    /** Validates selected option equals a specific value. @param value - Expected value. @param code - Optional error code */
    equals: <P extends ParamaterValue | string | number | boolean>(
      value: P,
      code?: string
    ) => OptionsFluent<TOptions, Push<TRules, EqualsRule<ToParam<P>>>, TProps>;
    /** Validates selected option is one of allowed values. @param values - Array of allowed values. @param code - Optional error code */
    oneOf: <P extends ParamaterValue[]>(
      values: P,
      code?: string
    ) => OptionsFluent<TOptions, Push<TRules, OneOfRule<P>>, TProps>;

    // — Conditional rules —
    /** Applies rules conditionally based on a predicate. @param pred - Condition to evaluate. @param cb - Builder callback for conditional rules */
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: OptionsRuleBuilder<TOptions, []>) => OptionsRuleBuilder<TOptions, WRules>
    ) => OptionsFluent<TOptions, [...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    /** Marks field as required or conditionally required. @param value - Boolean or predicate */
    setRequired: <P extends boolean | Predicate>(value: P) => OptionsFluent<TOptions, TRules, TProps & { required: P }>;
    /** Marks field as optional (shorthand for setRequired(false)) */
    optional: () => OptionsFluent<TOptions, TRules, TProps & { required: false }>;
    /** Controls if field can be modified after creation. @param value - Boolean or predicate */
    setMutable: <P extends boolean | Predicate>(value: P) => OptionsFluent<TOptions, TRules, TProps & { mutable: P }>;
    /** Controls if field is included in output. @param value - Boolean or predicate */
    setIncluded: <P extends boolean | Predicate>(value: P) => OptionsFluent<TOptions, TRules, TProps & { included: P }>;
    /** Marks field as private (masked in output). @param value - Boolean flag */
    setPrivate: <P extends boolean>(value: P) => OptionsFluent<TOptions, TRules, TProps & { private: P }>;
    /** Enables automatic type coercion. @param value - Boolean flag */
    setCoerce: <P extends boolean>(value: P) => OptionsFluent<TOptions, TRules, TProps & { coerce: P }>;
    /** Sets a default value when field is empty. @param value - Default option value */
    setDefault: <V extends TOptions[number]>(value: V) => OptionsFluent<TOptions, TRules, TProps & { default: V }>;
    /** Attaches UI metadata for form rendering. @param config - UI configuration object */
    ui: <TUI extends JsonRecord>(config: TUI) => OptionsFluent<TOptions, TRules, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factories
// ---------------------------------------------------------------------------

function createRuleBuilder<TOptions extends OptionsValue, TRules extends Rule[]>(
  opts: TOptions,
  rules: TRules
): OptionsRuleBuilder<TOptions, TRules> {
  const push = <R extends Rule>(rule: R): OptionsRuleBuilder<TOptions, Push<TRules, R>> =>
    createRuleBuilder(opts, [...rules, rule] as Push<TRules, R>);

  return {
    type: SchemaType.OPTIONS,
    options: opts,
    rules,
    equals: <P extends ParamaterValue>(value: P, code?: string) => push(equals(value, code)),
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => push(oneOf(values, code)),
  };
}

function createFluent<TOptions extends OptionsValue, TRules extends Rule[], TProps>(
  opts: TOptions,
  rules: TRules,
  props: TProps
): OptionsFluent<TOptions, TRules, TProps> {
  const pushRule = <R extends Rule>(rule: R): OptionsFluent<TOptions, Push<TRules, R>, TProps> =>
    createFluent(opts, [...rules, rule] as Push<TRules, R>, props);

  const setProp = <K extends string, V>(key: K, value: V): OptionsFluent<TOptions, TRules, TProps & Record<K, V>> =>
    createFluent(opts, rules, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.OPTIONS,
    options: opts,
    rules,
    ...props,

    // — Rule methods —
    equals: <P extends ParamaterValue | string | number | boolean>(value: P, code?: string) =>
      pushRule(equals(toParamaterValue(value), code)),
    oneOf: <P extends ParamaterValue[]>(values: P, code?: string) => pushRule(oneOf(values, code)),

    // — Conditional rules —
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: OptionsRuleBuilder<TOptions, []>) => OptionsRuleBuilder<TOptions, WRules>
    ) => {
      const result = cb(createRuleBuilder(opts, []));
      const conditionals = result.rules.map((rule) =>
        conditional({
          when: pred,
          then: rule as Exclude<Rule, ConditionalRule>,
        })
      ) as WrapConditionals<WRules>;
      return createFluent(opts, [...rules, ...conditionals] as [...TRules, ...WrapConditionals<WRules>], props);
    },

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => setProp("required", value),
    optional: () => setProp("required", false as false),
    setMutable: <P extends boolean | Predicate>(value: P) => setProp("mutable", value),
    setIncluded: <P extends boolean | Predicate>(value: P) => setProp("included", value),
    setPrivate: <P extends boolean>(value: P) => setProp("private", value),
    setCoerce: <P extends boolean>(value: P) => setProp("coerce", value),
    setDefault: <V extends TOptions[number]>(value: V) => setProp("default", value),
    ui: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as OptionsFluent<TOptions, TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function options<const TOptions extends OptionsValue>(
  opts: TOptions
): OptionsFluent<TOptions, [], Record<never, never>> {
  return createFluent(opts, [], {} as Record<never, never>);
}
