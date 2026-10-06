import { startOfDay, startOfMonth, startOfYear } from "date-fns";
import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import { type DateUnit, toDate, toPlainDate, UTC } from "../../utils/date-utils";
import type { ParamaterValue } from "../types";

export const startOfFunctionType = "start_of";

export type StartOfFunction<TValue extends ParamaterValue = never, TUnit extends DateUnit = DateUnit> = {
  type: typeof startOfFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
  unit: TUnit;
};

/**
 * Creates a transformer that returns the first moment (00:00:00.000 UTC) of the
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
 * // Expense must be in the same month as the claim, or later
 * object({ claimDate: date(), expenseDate: date().min(startOf(ref('claimDate'), 'month')) })
 *
 * @example
 * // Not before the start of the current year of the invoice
 * date().min(startOf(ref('invoiceDate'), 'year'))
 *
 * @see {@link endOf} - Last moment of a calendar unit
 */
export function startOf<const TValue extends ParamaterValue<Date> | Date, const TUnit extends DateUnit>(
  value: TValue,
  unit: TUnit
): StartOfFunction<ToParam<TValue>, TUnit> {
  return {
    type: startOfFunctionType,
    value: toParamaterValue(value),
    unit,
  };
}

const UNITS = {
  day: startOfDay,
  month: startOfMonth,
  year: startOfYear,
} as const satisfies Record<DateUnit, unknown>;

export function startOfFunction(value: ValueType | undefined, unit: DateUnit): Date | undefined {
  const date = toDate(value);
  return date === undefined || !Object.hasOwn(UNITS, unit) ? undefined : toPlainDate(UNITS[unit](date, UTC));
}
