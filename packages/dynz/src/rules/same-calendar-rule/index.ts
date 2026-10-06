import { type ParamaterValue, resolveExpected, sameCalendarFunction } from "../../functions";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import type { DateUnit } from "../../utils/date-utils";
import { isDate } from "../../validate/validate-type";

export type SameCalendarRule<T extends ParamaterValue<Date> = ParamaterValue<Date>, U extends DateUnit = DateUnit> = {
  type: "same_calendar";
  date: T;
  unit: U;
  code?: string | undefined;
};

export type SameCalendarRuleErrorMessage = ErrorMessageFromRule<SameCalendarRule, Date, "date">;

/**
 * Creates a validation rule that checks if a date falls in the same calendar
 * day, month or year (UTC) as another date. `'month'` also requires the same year.
 *
 * **Note:** This is the rule counterpart of the {@link sameCalendar} predicate.
 * Use the predicate in conditions (`when`, `setRequired`, ...), and this rule to
 * validate the field itself.
 *
 * @category Rule
 * @param date - The date to compare with (static date or reference)
 * @param unit - The calendar unit to compare
 * @param code - Optional custom error code for this validation
 * @returns A SameCalendarRule
 *
 * @example
 * // Pay date must be in the same calendar year as the start date
 * object({
 *   startDate: date(),
 *   payDate: date().sameCalendar(ref('startDate'), 'year'),
 * })
 */
export function buildSameCalendarRule<T extends ParamaterValue<Date>, U extends DateUnit>(
  date: T,
  unit: U,
  code?: string
): SameCalendarRule<T, U> {
  return { date, unit, type: "same_calendar", code };
}

export const sameCalendarRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, SameCalendarRule>,
  SameCalendarRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isDate(value)) {
    throw new Error("sameCalendarRule expects a date value");
  }

  const date = resolveExpected(rule.date, path, context, SchemaType.DATE);

  if (date === undefined) {
    return undefined;
  }

  return sameCalendarFunction(value, date, rule.unit)
    ? undefined
    : {
        code: "same_calendar",
        date,
        unit: rule.unit,
        message: `The value ${value} for schema ${path} is not in the same ${rule.unit} as ${date}`,
      };
};
