import { endOfDay, endOfMonth, endOfYear } from "date-fns";
import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import { type DateUnit, toDate, toPlainDate, UTC } from "../../utils/date-utils";
import type { ParamaterValue } from "../types";

export const endOfFunctionType = "end_of";

export type EndOfFunction<TValue extends ParamaterValue = never, TUnit extends DateUnit = DateUnit> = {
  type: typeof endOfFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
  unit: TUnit;
};

/**
 * Creates a transformer that returns the last moment (23:59:59.999 UTC) of the
 * day, month or year of a date.
 *
 * Returns `undefined` when the date cannot be resolved.
 *
 * @category Transformer
 * @param value - The date (static date, reference or transformer)
 * @param unit - The calendar unit
 * @returns A Transformer that evaluates to a Date
 *
 * @example
 * // Must be in the same month as the start date, or earlier
 * date().max(endOf(ref('startDate'), 'month'))
 *
 * @see {@link startOf} - First moment of a calendar unit
 */
export function endOf<const TValue extends ParamaterValue<Date> | Date, const TUnit extends DateUnit>(
  value: TValue,
  unit: TUnit
): EndOfFunction<ToParam<TValue>, TUnit> {
  return {
    type: endOfFunctionType,
    value: toParamaterValue(value),
    unit,
  };
}

const UNITS = {
  day: endOfDay,
  month: endOfMonth,
  year: endOfYear,
} as const satisfies Record<DateUnit, unknown>;

export function endOfFunction(value: ValueType | undefined, unit: DateUnit): Date | undefined {
  const date = toDate(value);
  return date === undefined || !Object.hasOwn(UNITS, unit) ? undefined : toPlainDate(UNITS[unit](date, UTC));
}
