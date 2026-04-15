import type { ParamaterValue, Predicate } from "../../functions";
import {
  type ConditionalRule,
  conditional,
  type MaxLengthRule,
  type MinLengthRule,
  maxLength,
  minLength,
  type Rule,
} from "../../rules";
import type { JsonRecord } from "../../types";
import { type Schema, SchemaType } from "../../types";
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

export type ArrayRuleBuilder<TSchema extends Schema, TRules extends Rule[]> = {
  readonly type: typeof SchemaType.ARRAY;
  readonly schema: TSchema;
  readonly rules: TRules;

  min: <P extends ParamaterValue<number>>(
    min: P,
    code?: string
  ) => ArrayRuleBuilder<TSchema, Push<TRules, MinLengthRule<P>>>;
  max: <P extends ParamaterValue<number>>(
    max: P,
    code?: string
  ) => ArrayRuleBuilder<TSchema, Push<TRules, MaxLengthRule<P>>>;
};

// ---------------------------------------------------------------------------
// Full fluent builder
//
// TSchema — the item schema type (carried so the schema data stays complete)
// TRules  — the accumulated rules as a precise tuple (index-accessible)
// TProps  — the schema property bag (required, mutable, coerce, …)
// ---------------------------------------------------------------------------

export type ArrayFluent<TSchema extends Schema, TRules extends Rule[], TProps> = {
  readonly type: typeof SchemaType.ARRAY;
  /** The schema applied to each array item */
  readonly schema: TSchema;
  /** Accumulated validation rules for this array */
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    /** Sets minimum array length. @param min - Minimum number of items. @param code - Optional error code */
    min: <P extends ParamaterValue<number> | number>(
      min: P,
      code?: string
    ) => ArrayFluent<TSchema, Push<TRules, MinLengthRule<ToParam<P>>>, TProps>;
    /** Sets maximum array length. @param max - Maximum number of items. @param code - Optional error code */
    max: <P extends ParamaterValue<number> | number>(
      max: P,
      code?: string
    ) => ArrayFluent<TSchema, Push<TRules, MaxLengthRule<ToParam<P>>>, TProps>;

    // — Conditional rules —
    /** Applies rules conditionally based on a predicate. @param pred - Condition to evaluate. @param cb - Builder callback for conditional rules */
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: ArrayRuleBuilder<TSchema, []>) => ArrayRuleBuilder<TSchema, WRules>
    ) => ArrayFluent<TSchema, [...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    /** Marks field as required or conditionally required. @param value - Boolean or predicate */
    setRequired: <P extends boolean | Predicate>(value: P) => ArrayFluent<TSchema, TRules, TProps & { required: P }>;
    /** Marks field as optional (shorthand for setRequired(false)) */
    optional: () => ArrayFluent<TSchema, TRules, TProps & { required: false }>;
    /** Controls if field can be modified after creation. @param value - Boolean or predicate */
    setMutable: <P extends boolean | Predicate>(value: P) => ArrayFluent<TSchema, TRules, TProps & { mutable: P }>;
    /** Controls if field is included in output. @param value - Boolean or predicate */
    setIncluded: <P extends boolean | Predicate>(value: P) => ArrayFluent<TSchema, TRules, TProps & { included: P }>;
    /** Marks field as private (masked in output). @param value - Boolean flag */
    setPrivate: <P extends boolean>(value: P) => ArrayFluent<TSchema, TRules, TProps & { private: P }>;
    /** Enables automatic type coercion. @param value - Boolean flag */
    setCoerce: <P extends boolean>(value: P) => ArrayFluent<TSchema, TRules, TProps & { coerce: P }>;
    /** Attaches UI metadata for form rendering. @param config - UI configuration object */
    ui: <TUI extends JsonRecord>(config: TUI) => ArrayFluent<TSchema, TRules, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factories
// ---------------------------------------------------------------------------

function createRuleBuilder<TSchema extends Schema, TRules extends Rule[]>(
  schema: TSchema,
  rules: TRules
): ArrayRuleBuilder<TSchema, TRules> {
  const push = <R extends Rule>(rule: R): ArrayRuleBuilder<TSchema, Push<TRules, R>> =>
    createRuleBuilder(schema, [...rules, rule] as Push<TRules, R>);

  return {
    type: SchemaType.ARRAY,
    schema,
    rules,
    min: <P extends ParamaterValue<number>>(min: P, code?: string) => push(minLength(min, code)),
    max: <P extends ParamaterValue<number>>(max: P, code?: string) => push(maxLength(max, code)),
  };
}

function createFluent<TSchema extends Schema, TRules extends Rule[], TProps>(
  schema: TSchema,
  rules: TRules,
  props: TProps
): ArrayFluent<TSchema, TRules, TProps> {
  const pushRule = <R extends Rule>(rule: R): ArrayFluent<TSchema, Push<TRules, R>, TProps> =>
    createFluent(schema, [...rules, rule] as Push<TRules, R>, props);

  const setProp = <K extends string, V>(key: K, value: V): ArrayFluent<TSchema, TRules, TProps & Record<K, V>> =>
    createFluent(schema, rules, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.ARRAY,
    schema,
    rules,
    ...props,

    // — Rule methods —
    min: <P extends ParamaterValue<number> | number>(min: P, code?: string) =>
      pushRule(minLength(toParamaterValue(min), code)),
    max: <P extends ParamaterValue<number> | number>(max: P, code?: string) =>
      pushRule(maxLength(toParamaterValue(max), code)),

    // — Conditional rules —
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: ArrayRuleBuilder<TSchema, []>) => ArrayRuleBuilder<TSchema, WRules>
    ) => {
      const result = cb(createRuleBuilder(schema, []));
      const conditionals = result.rules.map((rule) =>
        conditional({
          when: pred,
          then: rule as Exclude<Rule, ConditionalRule>,
        })
      ) as WrapConditionals<WRules>;
      return createFluent(schema, [...rules, ...conditionals] as [...TRules, ...WrapConditionals<WRules>], props);
    },

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => setProp("required", value),
    optional: () => setProp("required", false as false),
    setMutable: <P extends boolean | Predicate>(value: P) => setProp("mutable", value),
    setIncluded: <P extends boolean | Predicate>(value: P) => setProp("included", value),
    setPrivate: <P extends boolean>(value: P) => setProp("private", value),
    setCoerce: <P extends boolean>(value: P) => setProp("coerce", value),
    ui: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as ArrayFluent<TSchema, TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function array<const TSchema extends Schema>(schema: TSchema): ArrayFluent<TSchema, [], Record<never, never>> {
  return createFluent(schema, [], {} as Record<never, never>);
}
