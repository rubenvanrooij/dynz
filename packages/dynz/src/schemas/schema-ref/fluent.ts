import type { Predicate } from "../../functions";
import type { JsonRecord, SchemaMeta } from "../../types";
import { SchemaType } from "../../types";

// ---------------------------------------------------------------------------
// Full fluent builder
// ---------------------------------------------------------------------------

export type SchemaRefFluent<TValue, TProps> = {
  readonly type: typeof SchemaType.SCHEMA_REF;
  readonly uri: string;
} & TProps & {
    setRequired: <P extends boolean | Predicate>(value: P) => SchemaRefFluent<TValue, TProps & { required: P }>;
    optional: () => SchemaRefFluent<TValue, TProps & { required: false }>;
    setMutable: <P extends boolean | Predicate>(value: P) => SchemaRefFluent<TValue, TProps & { mutable: P }>;
    setIncluded: <P extends boolean | Predicate>(value: P) => SchemaRefFluent<TValue, TProps & { included: P }>;
    setPrivate: <P extends boolean>(value: P) => SchemaRefFluent<TValue, TProps & { private: P }>;
    setDefault: (value: TValue) => SchemaRefFluent<TValue, TProps & { default: TValue }>;
    setUi: <TUI extends JsonRecord>(config: TUI) => SchemaRefFluent<TValue, TProps & { ui: TUI }>;
    setMeta: <M extends SchemaMeta>(meta: M) => SchemaRefFluent<TValue, TProps & { meta: M }>;
    describe: (description: string) => SchemaRefFluent<TValue, TProps & { meta: SchemaMeta }>;
  };

// ---------------------------------------------------------------------------
// Runtime factory
// ---------------------------------------------------------------------------

function createFluent<TValue, TProps>(uri: string, props: TProps): SchemaRefFluent<TValue, TProps> {
  const setProp = <K extends string, V>(key: K, v: V): SchemaRefFluent<TValue, TProps & Record<K, V>> =>
    createFluent(uri, { ...props, [key]: v } as TProps & Record<K, V>);

  return {
    type: SchemaType.SCHEMA_REF,
    uri,
    ...props,

    setRequired: <P extends boolean | Predicate>(v: P) => setProp("required", v),
    optional: () => setProp("required", false as false),
    setMutable: <P extends boolean | Predicate>(v: P) => setProp("mutable", v),
    setIncluded: <P extends boolean | Predicate>(v: P) => setProp("included", v),
    setPrivate: <P extends boolean>(v: P) => setProp("private", v),
    setDefault: (v: TValue) => setProp("default", v),
    setUi: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
    setMeta: <M extends SchemaMeta>(meta: M) => setProp("meta", { ...(props as { meta?: SchemaMeta }).meta, ...meta }),
    describe: (description: string) => setProp("meta", { ...(props as { meta?: SchemaMeta }).meta, description }),
  } as SchemaRefFluent<TValue, TProps>;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Declares a schema resolved from an external URI at validate-time (like a JSON
 * Schema `$ref`, but resolved by a consumer-supplied function rather than dynz
 * itself fetching anything).
 *
 * The optional `T` generic is an **assertion, not a derivation**: dynz has no way
 * to know the resolved schema's real shape at compile time, so `SchemaValues<T>`
 * trusts whatever you declare here. Omit it and the field infers as `unknown`.
 *
 * Requires a `resolveSchemaRef` function to be passed to `validate()` — dynz never
 * fetches a URI itself (no assumed transport, no built-in SSRF surface).
 *
 * Not to be confused with `ref()` (a value-level pointer to a sibling field in the
 * *same* schema, used inside rules/conditions) — `schemaRef()` points to an entirely
 * separate schema, resolved from elsewhere.
 *
 * @example
 * ```ts
 * const schema = d.object({
 *   participants: d.array(d.schemaRef<Participant>("participant://example.com/over/there")),
 * });
 *
 * await validate(schema, undefined, values, {
 *   resolveSchemaRef: async (uri) => fetchSchemaFor(uri),
 * });
 * ```
 */
export function schemaRef<T = unknown>(uri: string): SchemaRefFluent<T, Record<never, never>> {
  return createFluent(uri, {} as Record<never, never>);
}
