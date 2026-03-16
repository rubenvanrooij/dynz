import type { Predicate } from "./types";

export const andPredicateType = "and";

export type AndPredicate<TPredicate extends Predicate[] = never> = {
  type: typeof andPredicateType;
  predicates: [TPredicate] extends [never] ? Predicate[] : TPredicate;
};

/**
 * Creates an AND predicate that returns true only if ALL predicates are true.
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are used with {@link conditional} rules to apply validation
 * rules based on dynamic conditions.
 *
 * @category Predicate
 * @param predicates - One or more predicates to combine with AND logic
 * @returns A CombinatorPredicate that is true when all predicates are true
 *
 * @example
 * // Both conditions must be true
 * and(
 *   eq(ref('status'), v('active')),
 *   gt(ref('age'), v(18))
 * )
 *
 * @example
 * // Use in conditional rule
 * conditional({
 *   when: and(eq(ref('country'), v('US')), gt(ref('age'), v(21))),
 *   then: equals(v(true))
 * })
 *
 * @see {@link or} - For OR logic (any predicate true)
 * @see {@link conditional} - Rule that applies based on predicates
 * @see {@link eq} - Equality predicate
 * @see {@link gt} - Greater than predicate
 */
export function and<const T extends Predicate[]>(...predicates: T): AndPredicate<T> {
  return {
    type: andPredicateType,
    predicates,
  };
}

export function andPredicate(predicates: Array<boolean | undefined>): boolean {
  return predicates.every((predicate) => predicate === true);
}
