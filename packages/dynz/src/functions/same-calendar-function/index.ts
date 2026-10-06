import { isSameDay, isSameMonth, isSameYear } from "date-fns";
import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import { type DateUnit, toDate, UTC } from "../../utils/date-utils";
import type { ParamaterValue } from "../types";

export const sameCalendarFunctionType = "same_calendar";

export type SameCalendarFunction<
  TLeft extends ParamaterValue = never,
  TRight extends ParamaterValue = never,
  TUnit extends DateUnit = DateUnit,
> = {
  type: typeof sameCalendarFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
  unit: TUnit;
};

/**
 * Creates a predicate that is true when two dates fall in the same calendar
 * day, month or year (UTC). `'month'` also requires the same year.
 *
 * Evaluates to `undefined` when either date cannot be resolved.
 *
 * **Note:** To validate a date field itself, use the `sameCalendar` rule
 * (`date().sameCalendar(ref('startDate'), 'year')`); use this predicate in
 * conditions (`when`, `setRequired`, ...).
 *
 * @category Predicate
 * @param left - The left date (static date, reference or transformer)
 * @param right - The right date (static date, reference or transformer)
 * @param unit - The calendar unit to compare
 * @returns A Predicate
 *
 * @example
 * // Only require a manager approval when the expense is in another month than the claim
 * boolean().setRequired(eq(sameCalendar(ref('expenseDate'), ref('claimDate'), 'month'), false))
 */
export function sameCalendar<
  const TLeft extends ParamaterValue<Date> | Date,
  const TRight extends ParamaterValue<Date> | Date,
  const TUnit extends DateUnit,
>(left: TLeft, right: TRight, unit: TUnit): SameCalendarFunction<ToParam<TLeft>, ToParam<TRight>, TUnit> {
  return {
    type: sameCalendarFunctionType,
    left: toParamaterValue(left),
    right: toParamaterValue(right),
    unit,
  };
}

const UNITS = {
  day: isSameDay,
  month: isSameMonth,
  year: isSameYear,
} as const satisfies Record<DateUnit, unknown>;

export function sameCalendarFunction(
  left: ValueType | undefined,
  right: ValueType | undefined,
  unit: DateUnit
): boolean | undefined {
  const l = toDate(left);
  const r = toDate(right);
  return l === undefined || r === undefined || !Object.hasOwn(UNITS, unit) ? undefined : UNITS[unit](l, r, UTC);
}
