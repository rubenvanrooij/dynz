import { describe, expect, it } from "vitest";
import { date, object, ref, sameCalendar, serialize, string, validate } from "../../index";
import { sameCalendarFunction } from "./index";

describe("sameCalendar function", () => {
  it("builds a serializable node with a static unit", () => {
    expect(sameCalendar(ref("payDate"), ref("startDate"), "year")).toEqual({
      type: "same_calendar",
      left: ref("payDate"),
      right: ref("startDate"),
      unit: "year",
    });
  });

  it("validates that two dates are in the same calendar year", async () => {
    const schema = object({
      startDate: date(),
      payDate: date().satisfies(sameCalendar(ref("payDate"), ref("startDate"), "year"), "SAME_YEAR"),
    });

    const startDate = new Date("2026-03-20T12:00:00Z");

    expect((await validate(schema, undefined, { startDate, payDate: new Date("2026-12-31T23:59:59Z") })).success).toBe(
      true
    );
    expect(await validate(schema, undefined, { startDate, payDate: new Date("2027-01-01T00:00:00Z") })).toMatchObject({
      success: false,
      errors: [{ path: "$.payDate", code: "satisfies", customCode: "SAME_YEAR" }],
    });
  });

  it("works as a condition against a static date after serialize()", async () => {
    const original = object({
      startDate: date(),
      note: string().setRequired(sameCalendar(ref("startDate"), new Date("2026-06-01T00:00:00Z"), "month")),
    });
    const roundTripped = JSON.parse(serialize(original));

    expect((await validate(roundTripped, undefined, { startDate: new Date("2026-06-30T00:00:00Z") })).success).toBe(
      false
    );
    expect((await validate(roundTripped, undefined, { startDate: new Date("2026-07-01T00:00:00Z") })).success).toBe(
      true
    );
  });
});

const d = (iso: string) => new Date(iso);

describe("sameCalendarFunction", () => {
  it("compares the calendar day, month and year in UTC", () => {
    expect(sameCalendarFunction(d("2026-03-15T00:00:00Z"), d("2026-03-15T23:59:59Z"), "day")).toBe(true);
    expect(sameCalendarFunction(d("2026-03-15T23:59:59Z"), d("2026-03-16T00:00:00Z"), "day")).toBe(false);
    expect(sameCalendarFunction(d("2026-03-01T00:00:00Z"), d("2026-03-31T23:59:59Z"), "month")).toBe(true);
    expect(sameCalendarFunction(d("2026-03-01T00:00:00Z"), d("2027-03-01T00:00:00Z"), "month")).toBe(false);
    expect(sameCalendarFunction(d("2026-01-01T00:00:00Z"), d("2026-12-31T23:59:59Z"), "year")).toBe(true);
    expect(sameCalendarFunction(d("2026-12-31T23:59:59Z"), d("2027-01-01T00:00:00Z"), "year")).toBe(false);
  });

  it("returns undefined when either side is not a date", () => {
    expect(sameCalendarFunction(undefined, d("2026-01-01T00:00:00Z"), "year")).toBeUndefined();
  });
});
