import type { AgeTransformer } from "./age-transformer";
import type { CeilTranformer } from "./ceil-transformer";
import type { CosTranformer } from "./cos-transformer";
import type { DivideTranformer } from "./divide-transformer";
import type { FloorTranformer } from "./floor-transformer";
import type { MultiplyTranformer } from "./multiply-transformer";
import type { SinTranformer } from "./sin-transformer";
import type { SizeTranformer } from "./size-transformer";
import type { SubTranformer } from "./sub-tranformer";
import type { SumTranformer } from "./sum-transformer";
import type { TanTranformer } from "./tan-transformer";

/**
 * A transformer computes/transforms values for use in rules or predicates.
 *
 * Transformers don't validate directly - they calculate values that can then
 * be used as inputs to validation rules or predicates.
 *
 * **Important:** Transformers are NOT rules! They don't produce validation errors.
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
  | CeilTranformer
  | CosTranformer
  | FloorTranformer
  | SinTranformer
  | SizeTranformer
  | SumTranformer
  | TanTranformer
  | AgeTransformer
  | SubTranformer
  | MultiplyTranformer
  | DivideTranformer;
