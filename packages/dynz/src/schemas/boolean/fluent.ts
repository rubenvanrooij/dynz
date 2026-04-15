import type { ParamaterValue, Predicate } from "../../functions";
import { type ConditionalRule, conditional, type EqualsRule, equals, type Rule } from "../../rules";
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

export type BoolRuleBuilder<TRules extends Rule[]> = {
  readonly type: typeof SchemaType.BOOLEAN;
  readonly rules: TRules;

  equals: <P extends ParamaterValue<boolean>>(value: P, code?: string) => BoolRuleBuilder<Push<TRules, EqualsRule<P>>>;
};

// ---------------------------------------------------------------------------
// Full fluent builder
//
// TRules  — the accumulated rules as a precise tuple (index-accessible)
// TProps  — the schema property bag (required, mutable, coerce, …)
// ---------------------------------------------------------------------------

export type BoolFluent<TRules extends Rule[], TProps> = {
  readonly type: typeof SchemaType.BOOLEAN;
  /** Accumulated validation rules for this boolean */
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    /** Validates boolean equals a specific value. @param value - Expected value (true/false). @param code - Optional error code */
    equals: <P extends ParamaterValue<boolean> | boolean>(
      value: P,
      code?: string
    ) => BoolFluent<Push<TRules, EqualsRule<ToParam<P>>>, TProps>;

    // — Conditional rules —
    /** Applies rules conditionally based on a predicate. @param pred - Condition to evaluate. @param cb - Builder callback for conditional rules */
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: BoolRuleBuilder<[]>) => BoolRuleBuilder<WRules>
    ) => BoolFluent<[...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    /** Marks field as required or conditionally required. @param value - Boolean or predicate */
    setRequired: <P extends boolean | Predicate>(value: P) => BoolFluent<TRules, TProps & { required: P }>;
    /** Marks field as optional (shorthand for setRequired(false)) */
    optional: () => BoolFluent<TRules, TProps & { required: false }>;
    /** Controls if field can be modified after creation. @param value - Boolean or predicate */
    setMutable: <P extends boolean | Predicate>(value: P) => BoolFluent<TRules, TProps & { mutable: P }>;
    /** Controls if field is included in output. @param value - Boolean or predicate */
    setIncluded: <P extends boolean | Predicate>(value: P) => BoolFluent<TRules, TProps & { included: P }>;
    /** Marks field as private (masked in output). @param value - Boolean flag */
    setPrivate: <P extends boolean>(value: P) => BoolFluent<TRules, TProps & { private: P }>;
    /** Enables automatic type coercion. @param value - Boolean flag */
    setCoerce: <P extends boolean>(value: P) => BoolFluent<TRules, TProps & { coerce: P }>;
    /** Sets a default value when field is empty. @param value - Default boolean value */
    setDefault: (value: boolean) => BoolFluent<TRules, TProps & { default: boolean }>;
    /** Attaches UI metadata for form rendering. @param config - UI configuration object */
    ui: <TUI extends JsonRecord>(config: TUI) => BoolFluent<TRules, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factories
// ---------------------------------------------------------------------------

function createRuleBuilder<TRules extends Rule[]>(rules: TRules): BoolRuleBuilder<TRules> {
  const push = <R extends Rule>(rule: R): BoolRuleBuilder<Push<TRules, R>> =>
    createRuleBuilder([...rules, rule] as Push<TRules, R>);

  return {
    type: SchemaType.BOOLEAN,
    rules,
    equals: <P extends ParamaterValue<boolean>>(value: P, code?: string) => push(equals(value, code)),
  };
}

function createFluent<TRules extends Rule[], TProps>(rules: TRules, props: TProps): BoolFluent<TRules, TProps> {
  const pushRule = <R extends Rule>(rule: R): BoolFluent<Push<TRules, R>, TProps> =>
    createFluent([...rules, rule] as Push<TRules, R>, props);

  const setProp = <K extends string, V>(key: K, value: V): BoolFluent<TRules, TProps & Record<K, V>> =>
    createFluent(rules, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.BOOLEAN,
    rules,
    ...props,

    // — Rule methods —
    equals: <P extends ParamaterValue<boolean> | boolean>(value: P, code?: string) =>
      pushRule(equals(toParamaterValue(value), code)),

    // — Conditional rules —
    when: <WRules extends Rule[]>(pred: Predicate, cb: (b: BoolRuleBuilder<[]>) => BoolRuleBuilder<WRules>) => {
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
    setDefault: (value: boolean) => setProp("default", value),
    ui: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as BoolFluent<TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function boolean(): BoolFluent<[], Record<never, never>> {
  return createFluent([], {} as Record<never, never>);
}
