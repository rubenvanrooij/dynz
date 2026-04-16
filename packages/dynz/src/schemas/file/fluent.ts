import type { ParamaterValue, Predicate } from "../../functions";
import {
  type ConditionalRule,
  conditional,
  type MaxSizeRule,
  type MimeTypeRule,
  type MinSizeRule,
  maxSize,
  mimeType,
  minSize,
  type Rule,
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
  /** Accumulated validation rules for this file */
  readonly rules: TRules;
} & TProps & {
    // — Rule methods —
    /** Sets minimum file size in bytes. @param min - Minimum size in bytes. @param code - Optional error code */
    minSize: <P extends ParamaterValue<number> | number>(
      min: P,
      code?: string
    ) => FileFluent<Push<TRules, MinSizeRule<ToParam<P>>>, TProps>;
    /** Sets maximum file size in bytes. @param max - Maximum size in bytes. @param code - Optional error code */
    maxSize: <P extends ParamaterValue<number> | number>(
      max: P,
      code?: string
    ) => FileFluent<Push<TRules, MaxSizeRule<ToParam<P>>>, TProps>;
    /** Restricts allowed MIME types. @param type - Single type or array of allowed types (e.g., "image/png"). @param code - Optional error code */
    mimeType: <P extends ParamaterValue<string | string[]> | string>(
      type: P,
      code?: string
    ) => FileFluent<Push<TRules, MimeTypeRule<ToParam<P>>>, TProps>;

    // — Conditional rules —
    /** Applies rules conditionally based on a predicate. @param pred - Condition to evaluate. @param cb - Builder callback for conditional rules */
    when: <WRules extends Rule[]>(
      pred: Predicate,
      cb: (b: FileRuleBuilder<[]>) => FileRuleBuilder<WRules>
    ) => FileFluent<[...TRules, ...WrapConditionals<WRules>], TProps>;

    // — Property setters —
    /** Marks field as required or conditionally required. @param value - Boolean or predicate */
    setRequired: <P extends boolean | Predicate>(value: P) => FileFluent<TRules, TProps & { required: P }>;
    /** Marks field as optional (shorthand for setRequired(false)) */
    optional: () => FileFluent<TRules, TProps & { required: false }>;
    /** Controls if field can be modified after creation. @param value - Boolean or predicate */
    setMutable: <P extends boolean | Predicate>(value: P) => FileFluent<TRules, TProps & { mutable: P }>;
    /** Controls if field is included in output. @param value - Boolean or predicate */
    setIncluded: <P extends boolean | Predicate>(value: P) => FileFluent<TRules, TProps & { included: P }>;
    /** Marks field as private (masked in output). @param value - Boolean flag */
    setPrivate: <P extends boolean>(value: P) => FileFluent<TRules, TProps & { private: P }>;
    /** Attaches UI metadata for form rendering. @param config - UI configuration object */
    setUi: <TUI extends JsonRecord>(config: TUI) => FileFluent<TRules, TProps & { ui: TUI }>;
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
    setUi: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as FileFluent<TRules, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function file(): FileFluent<[], Record<never, never>> {
  return createFluent([], {} as Record<never, never>);
}
