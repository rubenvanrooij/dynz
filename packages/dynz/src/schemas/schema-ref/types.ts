import type { BaseSchema, SchemaType } from "../../types";

/**
 * A schema resolved from an external URI at validate-time, rather than declared inline.
 *
 * Unrelated to `ref()`/`Reference` (a *value*-level pointer to another field in the same
 * schema, used inside rules/conditions) — `schemaRef()` is a *schema*-level pointer to a
 * schema declared elsewhere entirely (another service, a schema registry), resolved via
 * the `resolveSchemaRef` validate() option.
 *
 * Holds only a plain `uri` string (no function/thunk), so it survives the same
 * `JSON.stringify` round-trip every other dynz schema does.
 */
export type SchemaRef<T = unknown> = BaseSchema<T, typeof SchemaType.SCHEMA_REF, never> & {
  /** Opaque to dynz — scheme/transport/lookup semantics are entirely up to the resolver. */
  uri: string;
};
