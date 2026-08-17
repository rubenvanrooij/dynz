/**
 * Values that must never have their own properties recursed into by `DeepPartial` —
 * they're structurally objects, but semantically atomic. Without this, `Date`/`File`
 * would get every one of *their* properties marked optional too, which is never what's
 * wanted.
 */
type DeepPartialAtomic = string | number | boolean | bigint | symbol | null | undefined | Date | File;

/**
 * Like TypeScript's `Partial<T>`, but recursive: every property at every depth becomes
 * optional, not just the top level. Used for `getDefaultValues`'s return type, since a
 * schema's default shape only ever fills in the positions that actually have a default
 * — anywhere else, at any depth, is genuinely absent.
 */
export type DeepPartial<T> = T extends DeepPartialAtomic
  ? T
  : T extends ReadonlyArray<infer TItem>
    ? DeepPartial<TItem>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;
