import type { Predicate } from "../../functions";
import type { BaseSchema, Schema, SchemaType } from "../../types";
import type { DynamicOptionValue } from "../options/types";

/**
 * The runtime type discriminant for {@link Discriminator}. Deliberately not a
 * `SchemaType` member and `Discriminator` is deliberately not part of the `Schema`
 * union — a discriminator value is never a valid standalone field, array item, or object
 * property, only ever a discriminated union member's discriminator-key entry. Keeping it out
 * of `Schema` means none of the generic schema-tree-walkers (`validateType`, a JSON Schema
 * converter, etc.) need a case for a variant that's structurally impossible everywhere else.
 */
export const DISCRIMINATOR_TYPE = "discriminator" as const;

/**
 * The stored (normalized) shape of a discriminated union member's discriminator-key entry.
 * Unlike every other schema kind this carries no `required`/`mutable`/`rules`/`default` —
 * a discriminator's value is definitionally always present (if it's missing there's no
 * matching member) and there's nothing to further validate beyond equality.
 *
 * Authors never construct this directly: `discriminatedUnion()` normalizes a plain
 * `string | number | boolean | DynamicOptionValue` (exactly what an `options()` value looks
 * like) into this shape at construction time.
 */
export type Discriminator<T extends string | number | boolean = string | number | boolean> = {
  type: typeof DISCRIMINATOR_TYPE;
  value: T;
  /** Mirrors `DynamicOptionValue["enabled"]`; omitted/`undefined` means always enabled. */
  enabled?: boolean | Predicate;
};

/** Unwraps the authoring-time discriminator value to the literal type it normalizes to. */
type ToDiscriminatorValue<T> = T extends DynamicOptionValue
  ? T["value"]
  : T extends string | number | boolean
    ? T
    : never;

/**
 * Maps an authoring-time member (raw literal/DynamicOptionValue at the discriminator key) to
 * its normalized, stored form (a Discriminator at the discriminator key).
 */
export type NormalizeMember<TKey extends string, T> = {
  [K in keyof T]: K extends TKey ? Discriminator<ToDiscriminatorValue<T[K]>> : T[K];
};

// Per-element validation type: discriminator key accepts primitives or a DynamicOptionValue
// (to conditionally enable/disable that member, exactly like an options() value), all other
// keys must be Schema. Used as a self-referential constraint in discriminatedUnion() so
// TypeScript checks each key individually rather than collapsing the condition into a single
// index signature.
export type CheckMember<TKey extends string, T> = {
  [K in keyof T]: K extends TKey ? string | number | boolean | DynamicOptionValue : T[K] extends Schema ? T[K] : never;
};

export type DiscriminatedUnionSchema<
  TKey extends string = string,
  TSchemas extends Record<string, Schema | Discriminator>[] = Record<string, Schema | Discriminator>[],
> = BaseSchema<unknown, typeof SchemaType.DISCRIMINATED_UNION, never> & {
  key: TKey;
  schemas: [TSchemas] extends [never] ? Record<string, Schema | Discriminator>[] : TSchemas;
};
