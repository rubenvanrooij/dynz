import { addDays, addMonths, addYears } from "date-fns";
import { type ToParam, toParamaterValue } from "../../schemas";
import { SchemaType, type ValueType } from "../../types";
import { coerce } from "../../utils/coerce";
import { type DateUnit, toDate, toPlainDate, UTC } from "../../utils/date-utils";
import { isNumber } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const dateAddFunctionType = "date_add";

export type DateAddFunction<
  TValue extends ParamaterValue = never,
  TAmount extends ParamaterValue = never,
  TUnit extends DateUnit = DateUnit,
> = {
  type: typeof dateAddFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
  amount: [TAmount] extends [never] ? ParamaterValue : TAmount;
  unit: TUnit;
};

/**
 * Creates a transformer that adds an amount of days, months or years to a date (UTC).
 * A negative amount subtracts.
 *
 * When adding months or years lands on a day that doesn't exist in the target
 * month, the day is clamped to the last day of that month
 * (e.g. Jan 31st + 1 month = Feb 28th/29th).
 *
 * Returns `undefined` when the date or the amount cannot be resolved.
 *
 * @category Transformer
 * @param value - The date (static date, reference or transformer)
 * @param amount - The amount to add (static number, reference or transformer)
 * @param unit - The calendar unit of the amount
 * @returns A Transformer that evaluates to a Date
 *
 * @example
 * // End date must be at least 3 months after the start date
 * date().min(dateAdd(ref('startDate'), 3, 'month'))
 *
 * @example
 * // Must be within 30 days from now (static)
 * date().max(dateAdd(new Date(), 30, 'day'))
 *
 * @see {@link dateDiff} - Difference between two dates
 */
export function dateAdd<
  const TValue extends ParamaterValue<Date> | Date,
  const TAmount extends ParamaterValue<number> | number,
  const TUnit extends DateUnit,
>(value: TValue, amount: TAmount, unit: TUnit): DateAddFunction<ToParam<TValue>, ToParam<TAmount>, TUnit> {
  return {
    type: dateAddFunctionType,
    value: toParamaterValue(value),
    amount: toParamaterValue(amount),
    unit,
  };
}

const UNITS = {
  day: addDays,
  month: addMonths,
  year: addYears,
} as const satisfies Record<DateUnit, unknown>;

export function dateAddFunction(
  value: ValueType | undefined,
  amount: ValueType | undefined,
  unit: DateUnit
): Date | undefined {
  const date = toDate(value);
  const n = coerce(SchemaType.NUMBER, amount);
  return date === undefined || !isNumber(n) || !Number.isFinite(n) || !Object.hasOwn(UNITS, unit)
    ? undefined
    : toPlainDate(UNITS[unit](date, n, UTC));
}
