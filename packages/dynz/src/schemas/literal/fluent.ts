import type { Predicate } from "../../functions";
import type { JsonRecord } from "../../types";
import { SchemaType } from "../../types";
import type { LiteralValue } from "./types";

// ---------------------------------------------------------------------------
// Full fluent builder
// ---------------------------------------------------------------------------

export type LiteralFluent<TValue extends LiteralValue, TProps> = {
  readonly type: typeof SchemaType.LITERAL;
  readonly value: TValue;
} & TProps & {
    setRequired: <P extends boolean | Predicate>(value: P) => LiteralFluent<TValue, TProps & { required: P }>;
    optional: () => LiteralFluent<TValue, TProps & { required: false }>;
    setMutable: <P extends boolean | Predicate>(value: P) => LiteralFluent<TValue, TProps & { mutable: P }>;
    setIncluded: <P extends boolean | Predicate>(value: P) => LiteralFluent<TValue, TProps & { included: P }>;
    setPrivate: <P extends boolean>(value: P) => LiteralFluent<TValue, TProps & { private: P }>;
    setDefault: (value: TValue) => LiteralFluent<TValue, TProps & { default: TValue }>;
    setUi: <TUI extends JsonRecord>(config: TUI) => LiteralFluent<TValue, TProps & { ui: TUI }>;
  };

// ---------------------------------------------------------------------------
// Runtime factory
// ---------------------------------------------------------------------------

function createFluent<TValue extends LiteralValue, TProps>(
  value: TValue,
  props: TProps
): LiteralFluent<TValue, TProps> {
  const setProp = <K extends string, V>(key: K, v: V): LiteralFluent<TValue, TProps & Record<K, V>> =>
    createFluent(value, { ...props, [key]: v } as TProps & Record<K, V>);

  return {
    type: SchemaType.LITERAL,
    value,
    ...props,

    setRequired: <P extends boolean | Predicate>(v: P) => setProp("required", v),
    optional: () => setProp("required", false as false),
    setMutable: <P extends boolean | Predicate>(v: P) => setProp("mutable", v),
    setIncluded: <P extends boolean | Predicate>(v: P) => setProp("included", v),
    setPrivate: <P extends boolean>(v: P) => setProp("private", v),
    setDefault: (v: TValue) => setProp("default", v),
    setUi: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as LiteralFluent<TValue, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function literal<const TValue extends LiteralValue>(value: TValue): LiteralFluent<TValue, Record<never, never>> {
  return createFluent(value, {} as Record<never, never>);
}
