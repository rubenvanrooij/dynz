import { describe, expect, it } from "vitest";
import { type DateSchema, date, object } from "../../schemas";
import type { Context } from "../../types";
import { validate } from "../../validate";
import { boundaryDayRule, buildBoundaryDayRule } from "./index";

const d = (iso: string) => new Date(iso);

describe("boundary day rule", () => {
  it("should create boundary day rule", () => {
    expect(buildBoundaryDayRule("first", "month", "FIRST_OF_MONTH")).toEqual({
      type: "boundary_day",
      edge: "first",
      unit: "month",
      code: "FIRST_OF_MONTH",
    });
  });

  it("should be added by the fluent builder", () => {
    expect(date().boundaryDay("last", "year").rules).toEqual([{ type: "boundary_day", edge: "last", unit: "year" }]);
  });
});

describe("boundaryDayRule validator", () => {
  const context = {} as unknown as Context<DateSchema>;
  const schema = date();

  it("passes on the boundary day, ignoring the time", async () => {
    const rule = buildBoundaryDayRule("first", "month");

    expect(await boundaryDayRule({ rule, value: d("2026-03-01T23:59:59Z"), path: "$.d", schema, context })).toBe(
      undefined
    );
  });

  it("fails on any other day", async () => {
    const rule = buildBoundaryDayRule("last", "year");

    expect(await boundaryDayRule({ rule, value: d("2026-12-30T00:00:00Z"), path: "$.d", schema, context })).toEqual({
      code: "boundary_day",
      edge: "last",
      unit: "year",
      message: `The value ${d("2026-12-30T00:00:00Z")} for schema $.d is not the last day of the year`,
    });
  });

  it("throws for a non-date value", () => {
    const rule = buildBoundaryDayRule("first", "month");

    expect(() => boundaryDayRule({ rule, value: 1, path: "$.d", schema, context })).toThrow(
      "boundaryDayRule expects a date value"
    );
  });

  it("validates a field via the fluent builder", async () => {
    const schema = object({ startDate: date().boundaryDay("first", "month", "FIRST_OF_MONTH") });

    expect((await validate(schema, undefined, { startDate: d("2026-03-01T00:00:00Z") })).success).toBe(true);
    expect(await validate(schema, undefined, { startDate: d("2026-03-02T00:00:00Z") })).toMatchObject({
      success: false,
      errors: [{ path: "$.startDate", code: "boundary_day", customCode: "FIRST_OF_MONTH" }],
    });
  });
});
