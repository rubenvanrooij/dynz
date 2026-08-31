import type { ObjectSchema, SchemaValues } from "dynz";

/**
 * Values dynz infers from a schema are deeply readonly, because the schema builders
 * capture their input with `const` type parameters. Form state has to be writable, so
 * the readonly modifiers are stripped again for everything the consumer mutates.
 */
type Immutable = string | number | boolean | bigint | symbol | null | undefined | Date | File | Blob;

export type DeepMutable<T> = T extends Immutable
  ? T
  : T extends ReadonlyArray<infer TItem>
    ? DeepMutable<TItem>[]
    : { -readonly [TKey in keyof T]: DeepMutable<T[TKey]> };

export type DeepPartial<T> = T extends Immutable
  ? T
  : T extends ReadonlyArray<infer TItem>
    ? DeepPartial<TItem>[]
    : { [TKey in keyof T]?: DeepPartial<T[TKey]> };

/** The writable shape of a schema's values — what `useDynzForm` exposes as `values`. */
export type DynzFormValues<TSchema extends ObjectSchema<never>> = DeepMutable<SchemaValues<TSchema>>;

/**
 * What may be handed to `initialValues` / `reset`. Partial all the way down, since a
 * form typically starts out empty and is filled in field by field.
 */
export type DynzPartialFormValues<TSchema extends ObjectSchema<never>> = DeepPartial<DynzFormValues<TSchema>>;
