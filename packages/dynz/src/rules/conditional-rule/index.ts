import type { Predicate } from "../../functions";
import type { BaseRule, ResolvedRules } from "../../types";

export type ConditionalRuleCase<TRule extends ResolvedRules = never, TPredicate extends Predicate = Predicate> = {
  when: TPredicate;
  then: [TRule] extends [never] ? ResolvedRules : TRule;
};

export type ConditionalRule<T extends ConditionalRuleCase = ConditionalRuleCase> = BaseRule & {
  type: "conditional";
  cases: T[];
};

/**
 * Creates a conditional validation rule that applies different rules based on predicates.
 *
 * Conditional rules allow you to apply validation rules only when certain conditions
 * are met. Each case has a `when` predicate (boolean expression) and a `then` rule
 * that is applied when the predicate is true.
 *
 * This is where **predicates** and **rules** work together:
 * - The `when` clause uses **predicates** ({@link eq}, {@link gt}, {@link and}, {@link or}, etc.)
 * - The `then` clause uses **rules** ({@link equals}, {@link min}, {@link minLength}, etc.)
 *
 * @category Rule
 * @param cases - One or more condition/rule pairs
 * @returns A ConditionalRule that applies rules based on conditions
 *
 * @example
 * // Require parental approval for minors
 * boolean({
 *   rules: [
 *     conditional({
 *       when: lte(age(ref('birthDate')), v(18)),
 *       then: equals(v(true), 'Parental approval required for minors')
 *     })
 *   ]
 * })
 *
 * @example
 * // Different validation based on country
 * conditional(
 *   { when: eq(ref('country'), v('US')), then: minLength(v(5)) },  // US zip: 5 chars
 *   { when: eq(ref('country'), v('CA')), then: minLength(v(6)) }   // CA postal: 6 chars
 * )
 *
 * @example
 * // Complex conditions with and/or
 * conditional({
 *   when: and(
 *     eq(ref('type'), v('premium')),
 *     gt(ref('amount'), v(1000))
 *   ),
 *   then: equals(v(true), 'Manager approval required for premium orders over 1000')
 * })
 *
 * @see {@link eq} - Equality predicate for `when` clauses
 * @see {@link and} - Combine multiple predicates with AND
 * @see {@link or} - Combine multiple predicates with OR
 * @see {@link equals} - Common rule for `then` clauses
 */
export function buildConditionalRule<T extends ConditionalRuleCase>(...cases: T[]): ConditionalRule<T> {
  return { type: "conditional", cases };
}
