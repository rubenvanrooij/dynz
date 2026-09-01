import type { GlobalReference, GlobalType } from "../global";
// import type { Reference } from "../reference";
import type { Reference } from "../reference";
import type { ValueType } from "../types";
import type { Predicate } from "./predicate-types";
import type { Transformer } from "./transformer-types";

export const STATIC_TYPE = "_dstatic" as const;

/**
 * A static (constant) value wrapper.
 *
 * Use {@link v} to create static values for use in rules, predicates, and transformers.
 *
 * @category Helper
 */
export type Static<T extends ValueType = ValueType> = {
  type: typeof STATIC_TYPE;
  value: T;
};

/**
 * Which {@link GlobalReference}s are assignable where `ParamaterValue<V>` is expected: a
 * global's `globalType` (a {@link GlobalType}) only qualifies when its value is
 * assignable to `V` — e.g. a `date`-typed global is excluded from `ParamaterValue<number>`.
 *
 * When `V` is left at its default (the full `ValueType` union), every branch matches and
 * this resolves back to an unconstrained `GlobalReference` — the same permissiveness
 * generic predicate/transformer signatures already had.
 */
type GlobalReferenceFor<V extends ValueType> = {
  [K in GlobalType]: ValueType<K> extends V ? GlobalReference<string, K> : never;
}[GlobalType];

/**
 * A parameter value that can be used in rules, predicates, and transformers.
 *
 * This union type represents all possible value types:
 * - {@link Static} - A constant value wrapped with `v()`
 * - {@link Reference} - A reference to another field with `ref()`
 * - {@link GlobalReference} - A reference to an externally supplied global with `global()`
 *   or `createGlobals()`
 * - {@link Predicate} - A boolean expression
 * - {@link Transformer} - A computed/transformed value
 * - `undefined` - No value
 *
 * @category Core
 */
export type ParamaterValue<T extends ValueType = ValueType> =
  | Static<T>
  | undefined
  | Reference
  | GlobalReferenceFor<T>
  | Predicate
  | Transformer;

/**
 * A function is either a Transformer or a Predicate.
 *
 * @category Core
 * @see {@link Transformer} - Value computation functions
 * @see {@link Predicate} - Boolean expression functions
 */
export type Func = Transformer | Predicate;
