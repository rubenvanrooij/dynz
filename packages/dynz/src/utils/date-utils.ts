import { utc } from "@date-fns/utc";
import { SchemaType } from "../types";
import { isDate } from "../validate/validate-type";
import { coerce } from "./coerce";

/**
 * Calendar unit used by the date functions ({@link dateAdd}, {@link dateDiff},
 * {@link startOf}, {@link endOf}, {@link sameCalendar}).
 *
 * @category Helper
 */
export type DateUnit = "day" | "month" | "year";

/**
 * date-fns options that make all calendar math run in UTC, so results don't
 * depend on the time zone of the machine (server vs browser) that validates.
 */
export const UTC = { in: utc } as const;

/**
 * Converts a resolved value into a valid Date. Accepts Dates, ISO strings and
 * epoch milliseconds (static dates become ISO strings after `serialize()`).
 */
export function toDate(value: unknown): Date | undefined {
  const date = coerce(SchemaType.DATE, value);
  return isDate(date) ? date : undefined;
}

/** date-fns returns a UTCDate subclass when using {@link UTC}; normalize back to a plain Date instant. */
export function toPlainDate(date: Date): Date {
  return new Date(date.getTime());
}
