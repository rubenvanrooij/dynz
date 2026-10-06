import { describe, expect, it } from "vitest";
import { toDate } from "./date-utils";

const d = (iso: string) => new Date(iso);

describe("toDate", () => {
  it("accepts Dates, ISO strings and epoch milliseconds", () => {
    expect(toDate(d("2026-03-15T10:00:00Z"))).toEqual(d("2026-03-15T10:00:00Z"));
    expect(toDate("2026-03-15T10:00:00Z")).toEqual(d("2026-03-15T10:00:00Z"));
    expect(toDate(0)).toEqual(d("1970-01-01T00:00:00Z"));
  });

  it("returns undefined for values that are not a valid date", () => {
    expect(toDate(undefined)).toBeUndefined();
    expect(toDate(null)).toBeUndefined();
    expect(toDate("not a date")).toBeUndefined();
    expect(toDate(true)).toBeUndefined();
  });
});
