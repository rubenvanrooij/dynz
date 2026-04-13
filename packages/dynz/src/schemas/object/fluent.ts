import type { ParamaterValue, Predicate } from "../../functions";
import type { JsonRecord } from "../../types";
import {
  type ConditionalRule,
  conditional,
  type MaxEntriesRule,
  type MinEntriesRule,
  maxEntries,
  minEntries,
  type Rule,
} from "../../rules";
import { type Schema, SchemaType } from "../../types";

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

export type ObjectRuleBuilder<TFields extends Record<string, Schema>, TRules extends Rule[]> = {
  readonly type: typeof SchemaType.OBJECT;
  readonly fields: TFields;
  readonly rules: TRules;

  minEntries: <P extends ParamaterValue<number>>(
    min: P,
    code?: string
  ) => ObjectRuleBuilder<TFields, Push<TRules, MinEntriesRule<P>>>;
  maxEntries: <P extends ParamaterValue<number>>(
    max: P,
    code?: string
  ) => ObjectRuleBuilder<TFields, Push<TRules, MaxEntriesRule<P>>>;
};

// ---------------------------------------------------------------------------
// Full fluent builder
//
// TFields — the fields map type (carried so the schema data stays complete)
// TRules  — the accumulated rules as a precise tuple (index-accessible)
// TProps  — the schema property bag (required, mutable, …)
// ---------------------------------------------------------------------------

export type ObjectFluent<TFields extends Record<string, Schema>, TRules extends Rule[], TProps> = {
  readonly type: typeof SchemaType.OBJECT;
  readonly fields: TFields;
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    minEntries: <P extends ParamaterValue<number>>(
      min: P,
      code?: string
    ) => ObjectFluent<TFields, Push<TRules, MinEntriesRule<P>>, TProps>;
    maxEntries: <P extends ParamaterValue<number>>(
      max: P,
      code?: string
    ) => ObjectFluent<TFields, Push<TRules, MaxEntriesRule<P>>, TProps>;

    // — Conditional rules —
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: ObjectRuleBuilder<TFields, []>) => ObjectRuleBuilder<TFields, WRules>
    ) => ObjectFluent<TFields, [...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => ObjectFluent<TFields, TRules, TProps & { required: P }>;
    optional: () => ObjectFluent<TFields, TRules, TProps & { required: false }>;
    setMutable: <P extends boolean | Predicate>(value: P) => ObjectFluent<TFields, TRules, TProps & { mutable: P }>;
    setIncluded: <P extends boolean | Predicate>(value: P) => ObjectFluent<TFields, TRules, TProps & { included: P }>;
    setPrivate: <P extends boolean>(value: P) => ObjectFluent<TFields, TRules, TProps & { private: P }>;
    ui: <TUI extends JsonRecord>(config: TUI) => ObjectFluent<TFields, TRules, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factories
// ---------------------------------------------------------------------------

function createRuleBuilder<TFields extends Record<string, Schema>, TRules extends Rule[]>(
  fields: TFields,
  rules: TRules
): ObjectRuleBuilder<TFields, TRules> {
  const push = <R extends Rule>(rule: R): ObjectRuleBuilder<TFields, Push<TRules, R>> =>
    createRuleBuilder(fields, [...rules, rule] as Push<TRules, R>);

  return {
    type: SchemaType.OBJECT,
    fields,
    rules,
    minEntries: <P extends ParamaterValue<number>>(min: P, code?: string) => push(minEntries(min, code)),
    maxEntries: <P extends ParamaterValue<number>>(max: P, code?: string) => push(maxEntries(max, code)),
  };
}

function createFluent<TFields extends Record<string, Schema>, TRules extends Rule[], TProps>(
  fields: TFields,
  rules: TRules,
  props: TProps
): ObjectFluent<TFields, TRules, TProps> {
  const pushRule = <R extends Rule>(rule: R): ObjectFluent<TFields, Push<TRules, R>, TProps> =>
    createFluent(fields, [...rules, rule] as Push<TRules, R>, props);

  const setProp = <K extends string, V>(key: K, value: V): ObjectFluent<TFields, TRules, TProps & Record<K, V>> =>
    createFluent(fields, rules, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.OBJECT,
    fields,
    rules,
    ...props,

    // — Rule methods —
    minEntries: <P extends ParamaterValue<number>>(min: P, code?: string) => pushRule(minEntries(min, code)),
    maxEntries: <P extends ParamaterValue<number>>(max: P, code?: string) => pushRule(maxEntries(max, code)),

    // — Conditional rules —
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: ObjectRuleBuilder<TFields, []>) => ObjectRuleBuilder<TFields, WRules>
    ) => {
      const result = cb(createRuleBuilder(fields, []));
      const conditionals = result.rules.map((rule) =>
        conditional({ when: pred, then: rule as Exclude<Rule, ConditionalRule> })
      ) as WrapConditionals<WRules>;
      return createFluent(fields, [...rules, ...conditionals] as [...TRules, ...WrapConditionals<WRules>], props);
    },

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => setProp("required", value),
    optional: () => setProp("required", false as false),
    setMutable: <P extends boolean | Predicate>(value: P) => setProp("mutable", value),
    setIncluded: <P extends boolean | Predicate>(value: P) => setProp("included", value),
    setPrivate: <P extends boolean>(value: P) => setProp("private", value),
    ui: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as ObjectFluent<TFields, TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function object<const TFields extends Record<string, Schema>>(
  fields: TFields
): ObjectFluent<TFields, [], Record<never, never>> {
  return createFluent(fields, [], {} as Record<never, never>);
}
