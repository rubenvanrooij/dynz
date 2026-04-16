import type { ParamaterValue, Predicate } from "../../functions";
import type { JsonRecord } from "../../types";
import { SchemaType } from "../../types";

// ---------------------------------------------------------------------------
// Full fluent builder
//
// Expression schemas carry a computed value (ref, transformer, static, …)
// and have no validation rules (rules: never in ExpressionSchema).
//
// TValue — the ParamaterValue type (carried so the schema data stays complete)
// TProps — the schema property bag (required, mutable, coerce, …)
// ---------------------------------------------------------------------------

export type ExprFluent<TValue extends ParamaterValue, TProps> = {
  readonly type: typeof SchemaType.EXPRESSION;
  /** The computed expression (ref, transformer, static value, etc.) */
  readonly value: TValue;
} & TProps & {
    // — Property setters —
    /** Marks field as required or conditionally required. @param value - Boolean or predicate */
    setRequired: <P extends boolean | Predicate>(value: P) => ExprFluent<TValue, TProps & { required: P }>;
    /** Marks field as optional (shorthand for setRequired(false)) */
    optional: () => ExprFluent<TValue, TProps & { required: false }>;
    /** Controls if field can be modified after creation. @param value - Boolean or predicate */
    setMutable: <P extends boolean | Predicate>(value: P) => ExprFluent<TValue, TProps & { mutable: P }>;
    /** Controls if field is included in output. @param value - Boolean or predicate */
    setIncluded: <P extends boolean | Predicate>(value: P) => ExprFluent<TValue, TProps & { included: P }>;
    /** Marks field as private (masked in output). @param value - Boolean flag */
    setPrivate: <P extends boolean>(value: P) => ExprFluent<TValue, TProps & { private: P }>;
    /** Enables automatic type coercion. @param value - Boolean flag */
    setCoerce: <P extends boolean>(value: P) => ExprFluent<TValue, TProps & { coerce: P }>;
    /** Attaches UI metadata for form rendering. @param config - UI configuration object */
    setUi: <TUI extends JsonRecord>(config: TUI) => ExprFluent<TValue, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factory
// ---------------------------------------------------------------------------

function createFluent<TValue extends ParamaterValue, TProps>(val: TValue, props: TProps): ExprFluent<TValue, TProps> {
  const setProp = <K extends string, V>(key: K, value: V): ExprFluent<TValue, TProps & Record<K, V>> =>
    createFluent(val, { ...props, [key]: value } as TProps & Record<K, V>);

  return {
    type: SchemaType.EXPRESSION,
    value: val,
    ...props,

    setRequired: <P extends boolean | Predicate>(value: P) => setProp("required", value),
    optional: () => setProp("required", false as false),
    setMutable: <P extends boolean | Predicate>(value: P) => setProp("mutable", value),
    setIncluded: <P extends boolean | Predicate>(value: P) => setProp("included", value),
    setPrivate: <P extends boolean>(value: P) => setProp("private", value),
    setCoerce: <P extends boolean>(value: P) => setProp("coerce", value),
    setUi: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as ExprFluent<TValue, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function expr<const TValue extends ParamaterValue>(value: TValue): ExprFluent<TValue, Record<never, never>> {
  return createFluent(value, {} as Record<never, never>);
}
