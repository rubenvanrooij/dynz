import { type Predicate, resolvePredicate } from "../../functions";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, Schema } from "../../types";

export type SatisfiesRule<T extends Predicate = Predicate> = {
  type: "satisfies";
  predicate: T;
  code?: string | undefined;
};

export type SatisfiesRuleErrorMessage = ErrorMessageFromRule<Omit<SatisfiesRule, "predicate">>;

/**
 * Creates a validation rule that fails when a predicate evaluates to `false`.
 *
 * This turns any predicate (boolean expression) into a validation rule, so
 * conditions that can't be expressed by a dedicated rule can still produce a
 * validation error. When the predicate cannot be evaluated (e.g. a referenced
 * field is empty) the rule passes; combine with `required` when needed.
 *
 * **Note:** a predicate references values by path, so reference the field
 * itself by its own name to validate its value.
 *
 * @category Rule
 * @param predicate - The predicate that must hold
 * @param code - Optional custom error code for this validation
 * @returns A SatisfiesRule
 *
 * @example
 * // A contract may span at most 12 calendar months
 * object({
 *   startDate: date(),
 *   endDate: date().satisfies(lte(dateDiff(ref('endDate'), ref('startDate'), 'month'), 12), 'MAX_12_MONTHS'),
 * })
 *
 * @see {@link conditional} - Apply rules only when a predicate holds
 */
export function buildSatisfiesRule<T extends Predicate>(predicate: T, code?: string): SatisfiesRule<T> {
  return { predicate, type: "satisfies", code };
}

export const satisfiesRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, SatisfiesRule>,
  SatisfiesRuleErrorMessage
> = ({ rule, path, context }) =>
  resolvePredicate(rule.predicate, path, context) === false
    ? {
        code: "satisfies",
        message: `The value for schema ${path} does not satisfy the predicate "${rule.predicate.type}"`,
      }
    : undefined;
