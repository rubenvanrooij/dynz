import { differenceInCalendarDays, differenceInCalendarMonths, differenceInCalendarYears } from "date-fns";
import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import { type DateUnit, toDate, UTC } from "../../utils/date-utils";
import type { ParamaterValue } from "../types";

export const dateDiffFunctionType = "date_diff";

export type DateDiffFunction<
  TLeft extends ParamaterValue = never,
  TRight extends ParamaterValue = never,
  TUnit extends DateUnit = DateUnit,
> = {
  type: typeof dateDiffFunctionType;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
  unit: TUnit;
};

/**
 * Creates a transformer that returns the number of calendar days, months or
 * years between two dates (`left - right`, UTC). Only the calendar unit is
 * counted, so Jan 31st and Feb 1st are 1 month apart.
 *
 * Returns `undefined` when either date cannot be resolved.
 *
 * @category Transformer
 * @param left - The left date (static date, reference or transformer)
 * @param right - The right date (static date, reference or transformer)
 * @param unit - The calendar unit to count
 * @returns A Transformer that evaluates to a number
 *
 * @example
 * // Contract may span at most 12 months
 * lte(dateDiff(ref('endDate'), ref('startDate'), 'month'), 12)
 *
 * @see {@link dateAdd} - Add an amount to a date
 */
export function dateDiff<
  const TLeft extends ParamaterValue<Date> | Date,
  const TRight extends ParamaterValue<Date> | Date,
  const TUnit extends DateUnit,
>(left: TLeft, right: TRight, unit: TUnit): DateDiffFunction<ToParam<TLeft>, ToParam<TRight>, TUnit> {
  return {
    type: dateDiffFunctionType,
    left: toParamaterValue(left),
    right: toParamaterValue(right),
    unit,
  };
}

const UNITS = {
  day: differenceInCalendarDays,
  month: differenceInCalendarMonths,
  year: differenceInCalendarYears,
} as const satisfies Record<DateUnit, unknown>;

export function dateDiffFunction(
  left: ValueType | undefined,
  right: ValueType | undefined,
  unit: DateUnit
): number | undefined {
  const l = toDate(left);
  const r = toDate(right);
  return l === undefined || r === undefined || !Object.hasOwn(UNITS, unit) ? undefined : UNITS[unit](l, r, UTC);
}
