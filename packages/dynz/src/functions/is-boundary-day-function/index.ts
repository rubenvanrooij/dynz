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
 * Creates a predicate that is true when a date falls on the first or last day
 * of its month or year (UTC). The time of day is ignored.
 *
 * Evaluates to `undefined` when the date cannot be resolved.
 *
 * **Note:** To validate a date field itself, use the `boundaryDay` rule
 * (`date().boundaryDay('first', 'month')`); use this predicate in conditions
 * (`when`, `setRequired`, ...).
 *
 * @category Predicate
 * @param value - The date (static date, reference or transformer)
 * @param edge - `'first'` or `'last'` day of the period
 * @param unit - The calendar period: `'month'` or `'year'`
 * @returns A Predicate
 *
 * @example
 * // Only ask for a pro-rata reason when the contract doesn't start on the 1st
 * string().setRequired(eq(isBoundaryDay(ref('startDate'), 'first', 'month'), false))
 *
 * @see {@link startOf} - First moment of a calendar unit
 * @see {@link endOf} - Last moment of a calendar unit
 */
export function isBoundaryDay<
  const TValue extends ParamaterValue<Date> | Date,
  const TEdge extends BoundaryEdge,
  const TUnit extends BoundaryUnit,
>(value: TValue, edge: TEdge, unit: TUnit): IsBoundaryDayFunction<ToParam<TValue>, TEdge, TUnit> {
  return {
    type: isBoundaryDayFunctionType,
    value: toParamaterValue(value),
    edge,
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
