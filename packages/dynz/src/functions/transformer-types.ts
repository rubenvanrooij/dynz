import type { AgeFunction } from "./age-function";
import type { CeilFunction } from "./ceil-function";
import type { CosFunction } from "./cos-function";
import type { DivideFunction } from "./divide-function";
import type { FloorFunction } from "./floor-function";
import type { LookupFunction } from "./lookup-function";
import type { MultiplyFunction } from "./multiply-function";
import type { SinFunction } from "./sin-function";
import type { SizeFunction } from "./size-function";
import type { SubFunction } from "./sub-function";
import type { SumFunction } from "./sum-function";
import type { TanFunction } from "./tan-function";

/**
 * A transformer computes/transforms values for use in rules or predicates.
 *
 * Transformers don't validate directly - they calculate values that can then
 * be used as inputs to validation rules or predicates.
 *
 * **Important:** Transformers are NOT rules They don't produce validation errors.
 * They compute values that are then validated by rules.
 *
 * @category Transformer
 *
 * @example
 * // Transformer as input to a rule
 * number({
 *   rules: [min(sum(ref('margin'), ref('commission')))]
 *   //          ^^^--- sum() is the transformer
 *   //      ^^^------- min() is the rule
 * })
 *
 * @example
 * // Transformer in a predicate
 * conditional({
 *   when: lte(age(ref('birthDate')), v(18)),
 *   //        ^^^--- age() is the transformer
 *   //   ^^^-------- lte() is the predicate
 *   then: equals(v(true))
 * })
 *
 * @see {@link sum} - Addition transformer
 * @see {@link sub} - Subtraction transformer
 * @see {@link age} - Age calculation transformer
 * @see {@link size} - Size/length transformer
 */
export type Transformer =
  | CeilFunction
  | CosFunction
  | FloorFunction
  | SinFunction
  | SizeFunction
  | SumFunction
  | TanFunction
  | AgeFunction
  | SubFunction
  | MultiplyFunction
  | DivideFunction
  | LookupFunction;
