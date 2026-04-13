import type { ParamaterValue, Predicate } from "../../functions";
import type { JsonRecord } from "../../types";
import { type ToParam, toParamaterValue } from "../shared";
import {
  type ConditionalRule,
  conditional,
  type MaxSizeRule,
  maxSize,
  type MimeTypeRule,
  mimeType,
  type MinSizeRule,
  minSize,
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

export type FileRuleBuilder<TRules extends Rule[]> = {
  readonly type: typeof SchemaType.FILE;
  readonly rules: TRules;

  minSize: <P extends ParamaterValue<number>>(min: P, code?: string) => FileRuleBuilder<Push<TRules, MinSizeRule<P>>>;
  maxSize: <P extends ParamaterValue<number>>(max: P, code?: string) => FileRuleBuilder<Push<TRules, MaxSizeRule<P>>>;
  mimeType: <P extends ParamaterValue<string | string[]>>(
    type: P,
    code?: string
  ) => FileRuleBuilder<Push<TRules, MimeTypeRule<P>>>;
};

// ---------------------------------------------------------------------------
// Full fluent builder
//
// TRules  — the accumulated rules as a precise tuple (index-accessible)
// TProps  — the schema property bag (required, mutable, …)
// ---------------------------------------------------------------------------

export type FileFluent<TRules extends Rule[], TProps> = {
  readonly type: typeof SchemaType.FILE;
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    minSize: <P extends ParamaterValue<number> | number>(
      min: P,
      code?: string
    ) => FileFluent<Push<TRules, MinSizeRule<ToParam<P>>>, TProps>;
    maxSize: <P extends ParamaterValue<number> | number>(
      max: P,
      code?: string
    ) => FileFluent<Push<TRules, MaxSizeRule<ToParam<P>>>, TProps>;
    mimeType: <P extends ParamaterValue<string | string[]> | string>(
      type: P,
      code?: string
    ) => FileFluent<Push<TRules, MimeTypeRule<ToParam<P>>>, TProps>;

    // — Conditional rules —
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: FileRuleBuilder<[]>) => FileRuleBuilder<WRules>
    ) => FileFluent<[...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => FileFluent<TRules, TProps & { required: P }>;
    optional: () => FileFluent<TRules, TProps & { required: false }>;
    setMutable: <P extends boolean | Predicate>(value: P) => FileFluent<TRules, TProps & { mutable: P }>;
    setIncluded: <P extends boolean | Predicate>(value: P) => FileFluent<TRules, TProps & { included: P }>;
    setPrivate: <P extends boolean>(value: P) => FileFluent<TRules, TProps & { private: P }>;
    ui: <TUI extends JsonRecord>(config: TUI) => FileFluent<TRules, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factories
// ---------------------------------------------------------------------------

function createRuleBuilder<TRules extends Rule[]>(rules: TRules): FileRuleBuilder<TRules> {
  const push = <R extends Rule>(rule: R): FileRuleBuilder<Push<TRules, R>> =>
    createRuleBuilder([...rules, rule] as Push<TRules, R>);

  return {
    type: SchemaType.FILE,
    rules,
    minSize: <P extends ParamaterValue<number>>(min: P, code?: string) => push(minSize(min, code)),
    maxSize: <P extends ParamaterValue<number>>(max: P, code?: string) => push(maxSize(max, code)),
    mimeType: <P extends ParamaterValue<string | string[]>>(type: P, code?: string) => push(mimeType(type, code)),
  };
}

function createFluent<TRules extends Rule[], TProps>(rules: TRules, props: TProps): FileFluent<TRules, TProps> {
  const pushRule = <R extends Rule>(rule: R): FileFluent<Push<TRules, R>, TProps> =>
    createFluent([...rules, rule] as Push<TRules, R>, props);

  const setProp = <K extends string, V>(key: K, value: V): FileFluent<TRules, TProps & Record<K, V>> =>
    createFluent(rules, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.FILE,
    rules,
    ...props,

    // — Rule methods —
    minSize: <P extends ParamaterValue<number> | number>(min: P, code?: string) =>
      pushRule(minSize(toParamaterValue(min), code)),
    maxSize: <P extends ParamaterValue<number> | number>(max: P, code?: string) =>
      pushRule(maxSize(toParamaterValue(max), code)),
    mimeType: <P extends ParamaterValue<string | string[]> | string>(type: P, code?: string) =>
      pushRule(mimeType(toParamaterValue(type), code)),

    // — Conditional rules —
    when: <WRules extends Rule[]>(pred: Predicate, cb: (b: FileRuleBuilder<[]>) => FileRuleBuilder<WRules>) => {
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
    ui: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as FileFluent<TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function file(): FileFluent<[], Record<never, never>> {
  return createFluent([], {} as Record<never, never>);
}
