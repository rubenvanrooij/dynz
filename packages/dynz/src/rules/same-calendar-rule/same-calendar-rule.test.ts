import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type DateSchema, date, object } from "../../schemas";
import type { Context } from "../../types";
import { validate } from "../../validate";
import { buildSameCalendarRule, sameCalendarRule } from "./index";

const d = (iso: string) => new Date(iso);

describe("same calendar rule", () => {
  it("should create same calendar rule with reference", () => {
    expect(buildSameCalendarRule(ref("startDate"), "year")).toEqual({
      type: "same_calendar",
      date: { type: REFERENCE_TYPE, path: "startDate" },
      unit: "year",
    });
  });

  it("should create same calendar rule with custom code via the fluent builder", () => {
    expect(date().sameCalendar(d("2026-01-01T00:00:00Z"), "month", "SAME_MONTH").rules).toEqual([
      { type: "same_calendar", date: v(d("2026-01-01T00:00:00Z")), unit: "month", code: "SAME_MONTH" },
    ]);
  });
});

describe("sameCalendarRule validator", () => {
  const context = {} as unknown as Context<DateSchema>;
  const schema = date();

  it("passes for a date in the same calendar unit", async () => {
    const rule = buildSameCalendarRule(v(d("2026-03-20T12:00:00Z")), "year");

    expect(await sameCalendarRule({ rule, value: d("2026-12-31T23:59:59Z"), path: "$.d", schema, context })).toBe(
      undefined
    );
  });

  it("fails for a date in another calendar unit", async () => {
    const rule = buildSameCalendarRule(v(d("2026-03-20T12:00:00Z")), "month");

    expect(await sameCalendarRule({ rule, value: d("2026-04-01T00:00:00Z"), path: "$.d", schema, context })).toEqual({
      code: "same_calendar",
      date: d("2026-03-20T12:00:00Z"),
      unit: "month",
      message: `The value ${d("2026-04-01T00:00:00Z")} for schema $.d is not in the same month as ${d("2026-03-20T12:00:00Z")}`,
    });
  });

  it("throws for a non-date value", () => {
    const rule = buildSameCalendarRule(v(d("2026-03-20T12:00:00Z")), "day");

    expect(() => sameCalendarRule({ rule, value: "nope", path: "$.d", schema, context })).toThrow(
      "sameCalendarRule expects a date value"
    );
  });

  it("validates against another field without referencing itself", async () => {
    const schema = object({
      startDate: date(),
      payDate: date().sameCalendar(ref("startDate"), "year", "SAME_YEAR"),
    });

    const startDate = d("2026-03-20T12:00:00Z");

    expect((await validate(schema, undefined, { startDate, payDate: d("2026-12-31T00:00:00Z") })).success).toBe(true);
    expect(await validate(schema, undefined, { startDate, payDate: d("2027-01-01T00:00:00Z") })).toMatchObject({
      success: false,
      errors: [{ path: "$.payDate", code: "same_calendar", customCode: "SAME_YEAR", unit: "year", date: startDate }],
    });
  });

  it("passes when the other date is empty", async () => {
    const schema = object({
      startDate: date().optional(),
      payDate: date().sameCalendar(ref("startDate"), "year"),
    });

    expect((await validate(schema, undefined, { payDate: d("2027-01-01T00:00:00Z") })).success).toBe(true);
  });
});
