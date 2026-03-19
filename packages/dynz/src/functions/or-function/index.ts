import type { Predicate } from "../predicate-types";

export const orFunctionType = "or";

export type OrFunction<TPredicate extends Predicate[] = never> = {
  type: typeof orFunctionType;
  predicates: [TPredicate] extends [never] ? Predicate[] : TPredicate;
};

/**
 * Creates an OR predicate that returns true if ANY predicate is true.
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are used with {@link conditional} rules to apply validation
 * rules based on dynamic conditions.
 *
 * @category Predicate
 * @param predicates - One or more predicates to combine with OR logic
 * @returns A CombinatorPredicate that is true when any predicate is true
 *
 * @example
 * // Either condition can be true
 * or(
 *   eq(ref('role'), v('admin')),
 *   eq(ref('role'), v('superuser'))
 * )
 *
 * @example
 * // Use in conditional rule
 * conditional({
 *   when: or(eq(ref('type'), v('premium')), gt(ref('balance'), v(1000))),
 *   then: equals(v(true))
 * })
 *
 * @see {@link and} - For AND logic (all predicates true)
 * @see {@link conditional} - Rule that applies based on predicates
 */
export function or<const T extends Predicate[]>(...predicates: T): OrFunction<T> {
  return {
    type: orFunctionType,
    predicates,
  };
}

export function orFunction(predicates: Array<boolean | undefined>): boolean {
  return predicates.some((predicate) => predicate === true);
}
