import { type BoundaryEdge, type BoundaryUnit, isBoundaryDayFunction } from "../../functions";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, Schema } from "../../types";
import { isDate } from "../../validate/validate-type";

export type BoundaryDayRule<E extends BoundaryEdge = BoundaryEdge, U extends BoundaryUnit = BoundaryUnit> = {
  type: "boundary_day";
  edge: E;
  unit: U;
  code?: string | undefined;
};

export type BoundaryDayRuleErrorMessage = ErrorMessageFromRule<BoundaryDayRule>;

/**
 * Creates a validation rule that checks if a date falls on the first or last
 * day of its month or year (UTC). The time of day is ignored.
 *
 * **Note:** This is the rule counterpart of the {@link isBoundaryDay} predicate.
 * Use the predicate in conditions (`when`, `setRequired`, ...), and this rule to
 * validate the field itself.
 *
 * @category Rule
 * @param edge - `'first'` or `'last'` day of the period
 * @param unit - The calendar period: `'month'` or `'year'`
 * @param code - Optional custom error code for this validation
 * @returns A BoundaryDayRule
 *
 * @example
 * // Start date must be the first day of a month
 * date().boundaryDay('first', 'month')
 *
 * @example
 * // Closing date must be December 31st
 * date().boundaryDay('last', 'year')
 */
export function buildBoundaryDayRule<E extends BoundaryEdge, U extends BoundaryUnit>(
  edge: E,
  unit: U,
  code?: string
): BoundaryDayRule<E, U> {
  return { edge, unit, type: "boundary_day", code };
}

export const boundaryDayRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, BoundaryDayRule>,
  BoundaryDayRuleErrorMessage
> = ({ rule, value, path }) => {
  if (!isDate(value)) {
    throw new Error("boundaryDayRule expects a date value");
  }

  return isBoundaryDayFunction(value, rule.edge, rule.unit)
    ? undefined
    : {
        code: "boundary_day",
        edge: rule.edge,
        unit: rule.unit,
        message: `The value ${value} for schema ${path} is not the ${rule.edge} day of the ${rule.unit}`,
      };
};
