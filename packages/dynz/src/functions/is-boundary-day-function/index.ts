import { endOfMonth, endOfYear, isSameDay, startOfMonth, startOfYear } from "date-fns";
import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import { toDate, UTC } from "../../utils/date-utils";
import type { ParamaterValue } from "../types";

export const isBoundaryDayFunctionType = "is_boundary_day";

/** Which boundary day of a period: the first or the last day. */
export type BoundaryEdge = "first" | "last";

/** The calendar period whose boundary day is checked. */
export type BoundaryUnit = "month" | "year";

export type IsBoundaryDayFunction<
  TValue extends ParamaterValue = never,
  TEdge extends BoundaryEdge = BoundaryEdge,
  TUnit extends BoundaryUnit = BoundaryUnit,
> = {
  type: typeof isBoundaryDayFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
  edge: TEdge;
  unit: TUnit;
};

/**
 * Creates a predicate that is true when a date falls on the first day of its
 * month or year (UTC). The time of day is ignored.
 *
 * Evaluates to `undefined` when the date cannot be resolved.
 *
 * **Note:** To validate a date field itself, use the `firstDayOf` rule
 * (`date().firstDayOf('month')`); use this predicate in conditions
 * (`when`, `setRequired`, ...).
 *
 * @category Predicate
 * @param value - The date (static date, reference or transformer)
 * @param unit - The calendar period: `'month'` or `'year'`
 * @returns A Predicate
 *
 * @example
 * // Only ask for a pro-rata reason when the contract doesn't start on the 1st
 * string().setRequired(eq(isFirstDayOf(ref('startDate'), 'month'), false))
 *
 * @see {@link isLastDayOf} - Last day of a month or year
 * @see {@link startOf} - First moment of a calendar unit
 */
export function isFirstDayOf<const TValue extends ParamaterValue<Date> | Date, const TUnit extends BoundaryUnit>(
  value: TValue,
  unit: TUnit
): IsBoundaryDayFunction<ToParam<TValue>, "first", TUnit> {
  return {
    type: isBoundaryDayFunctionType,
    value: toParamaterValue(value),
    edge: "first",
    unit,
  };
}

/**
 * Creates a predicate that is true when a date falls on the last day of its
 * month or year (UTC). The time of day is ignored.
 *
 * Evaluates to `undefined` when the date cannot be resolved.
 *
 * **Note:** To validate a date field itself, use the `lastDayOf` rule
 * (`date().lastDayOf('year')`); use this predicate in conditions
 * (`when`, `setRequired`, ...).
 *
 * @category Predicate
 * @param value - The date (static date, reference or transformer)
 * @param unit - The calendar period: `'month'` or `'year'`
 * @returns A Predicate
 *
 * @example
 * // Only require a closing note when the period ends on December 31st
 * string().setRequired(isLastDayOf(ref('periodEnd'), 'year'))
 *
 * @see {@link isFirstDayOf} - First day of a month or year
 * @see {@link endOf} - Last moment of a calendar unit
 */
export function isLastDayOf<const TValue extends ParamaterValue<Date> | Date, const TUnit extends BoundaryUnit>(
  value: TValue,
  unit: TUnit
): IsBoundaryDayFunction<ToParam<TValue>, "last", TUnit> {
  return {
    type: isBoundaryDayFunctionType,
    value: toParamaterValue(value),
    edge: "last",
    unit,
  };
}

const BOUNDARIES = {
  first: { month: startOfMonth, year: startOfYear },
  last: { month: endOfMonth, year: endOfYear },
} as const satisfies Record<BoundaryEdge, Record<BoundaryUnit, unknown>>;

export function isBoundaryDayFunction(
  value: ValueType | undefined,
  edge: BoundaryEdge,
  unit: BoundaryUnit
): boolean | undefined {
  const date = toDate(value);
  const boundary =
    Object.hasOwn(BOUNDARIES, edge) && Object.hasOwn(BOUNDARIES[edge], unit) ? BOUNDARIES[edge][unit] : undefined;
  return date === undefined || boundary === undefined ? undefined : isSameDay(date, boundary(date, UTC), UTC);
}
