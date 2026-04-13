import type { AndFunction } from "./and-function";
// import type { CustomFunction } from "./custom-function";
import type { EqualsFunction } from "./equals-function";
import type { GreaterThanFunction } from "./greater-than-function";
import type { GreaterThanOrEqualFunction } from "./greater-than-or-equal-function";
import type { IsInFunction } from "./is-in-function";
import type { IsNotInFunction } from "./is-not-in-function";
import type { LowerThanFunction } from "./lower-than-function";
import type { LowerThanOrEqualFunction } from "./lower-than-or-equal-function";
import type { MatchesFunction } from "./matches-function";
import type { NotEqualsFunction } from "./not-equals-function";
import type { OrFunction } from "./or-function";

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
  | AndFunction
  // | CustomFunction
  | EqualsFunction
  | GreaterThanFunction
  | GreaterThanOrEqualFunction
  | IsInFunction
  | IsNotInFunction
  | LowerThanFunction
  | LowerThanOrEqualFunction
  | MatchesFunction
  | NotEqualsFunction
  | OrFunction;
