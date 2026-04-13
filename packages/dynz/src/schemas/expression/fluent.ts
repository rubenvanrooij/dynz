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
  readonly value: TValue;
} & TProps & {
    // — Property setters —
    setRequired: <P extends boolean | Predicate>(value: P) => ExprFluent<TValue, TProps & { required: P }>;
    optional: () => ExprFluent<TValue, TProps & { required: false }>;
    setMutable: <P extends boolean | Predicate>(value: P) => ExprFluent<TValue, TProps & { mutable: P }>;
    setIncluded: <P extends boolean | Predicate>(value: P) => ExprFluent<TValue, TProps & { included: P }>;
    setPrivate: <P extends boolean>(value: P) => ExprFluent<TValue, TProps & { private: P }>;
    setCoerce: <P extends boolean>(value: P) => ExprFluent<TValue, TProps & { coerce: P }>;
    ui: <TUI extends JsonRecord>(config: TUI) => ExprFluent<TValue, TProps & { ui: TUI }>;
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
    ui: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as ExprFluent<TValue, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function expr<const TValue extends ParamaterValue>(value: TValue): ExprFluent<TValue, Record<never, never>> {
  return createFluent(value, {} as Record<never, never>);
}
