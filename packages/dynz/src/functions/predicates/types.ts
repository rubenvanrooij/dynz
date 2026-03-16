import type { AndPredicate } from "./and-predicate";
import type { CustomPredicate } from "./custom-predicate";
import type { EqualsPredicate } from "./equals-predicate";
import type { GreaterThanOrEqualPredicate } from "./greater-than-or-equal-predicate";
import type { GreaterThanPredicate } from "./greater-than-predicate";
import type { IsInPredicate } from "./is-in-predicate";
import type { IsNotInPredicate } from "./is-not-in-predicate";
import type { LowerThanOrEqualPredicate } from "./lower-than-or-equal-predicate";
import type { LowerThanPredicate } from "./lower-than-predicate";
import type { MatchesPredicate } from "./matches-predicate";
import type { NotEqualsPredicate } from "./not-equals-predicate";
import type { OrPredicate } from "./or-predicate";

/**
 * A predicate is a boolean expression used in conditional logic.
 *
 * Predicates evaluate to true/false and are used with conditional rules
 * to apply validation rules based on dynamic conditions.
 *
 * **Important:** Predicates are NOT rules! They don't validate field values directly.
 * They are used in `when` clauses to determine IF a rule should be applied.
 *
 * @category Predicate
 *
 * @example
 * // Predicates in conditional rules
 * conditional({
 *   when: eq(ref('status'), v('active')),  // <-- This is a predicate
 *   then: min(v(10))                        // <-- This is a rule
 * })
 *
 * @example
 * // Combining predicates
 * and([
 *   equals(ref('country'), v('US')),
 *   greaterThan(ref('age'), v(18))
 * ])
 *
 * @see {@link equals} - Equality predicate (===)
 * @see {@link greaterThan} - Greater than predicate (>)
 * @see {@link and} - AND combinator
 * @see {@link or} - OR combinator
 */
export type Predicate =
  | AndPredicate
  | CustomPredicate
  | EqualsPredicate
  | GreaterThanPredicate
  | GreaterThanOrEqualPredicate
  | IsInPredicate
  | IsNotInPredicate
  | LowerThanPredicate
  | LowerThanOrEqualPredicate
  | MatchesPredicate
  | NotEqualsPredicate
  | OrPredicate;
