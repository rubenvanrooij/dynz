import { describe, expect, it } from "vitest";
import { date, isFirstDayOf, isLastDayOf, object, ref, v, validate } from "../../index";
import type { ValueType } from "../../types";
import { type BoundaryEdge, type BoundaryUnit, isBoundaryDayFunction } from "./index";

const d = (iso: string) => new Date(iso);

describe("isFirstDayOf / isLastDayOf functions", () => {
  it("builds a serializable node with a static edge and unit", () => {
    expect(isFirstDayOf(ref("startDate"), "month")).toEqual({
      type: "is_boundary_day",
      value: ref("startDate"),
      edge: "first",
      unit: "month",
    });
    expect(isLastDayOf(d("2026-01-01T00:00:00Z"), "year")).toEqual({
      type: "is_boundary_day",
      value: v(d("2026-01-01T00:00:00Z")),
      edge: "last",
      unit: "year",
    });
  });

  it("validates that a date is the first day of a month", async () => {
    const schema = object({
      startDate: date().satisfies(isFirstDayOf(ref("startDate"), "month")),
    });

    expect((await validate(schema, undefined, { startDate: d("2026-03-01T00:00:00Z") })).success).toBe(true);
    expect((await validate(schema, undefined, { startDate: d("2026-03-02T00:00:00Z") })).success).toBe(false);
  });
});

describe("isBoundaryDayFunction", () => {
  it("checks the first and last day of the UTC month, ignoring the time", () => {
    expect(isBoundaryDayFunction(d("2026-03-01T23:59:59Z"), "first", "month")).toBe(true);
    expect(isBoundaryDayFunction(d("2026-02-28T23:59:59Z"), "first", "month")).toBe(false);
    expect(isBoundaryDayFunction(d("2026-02-28T00:00:00Z"), "last", "month")).toBe(true);
    expect(isBoundaryDayFunction(d("2028-02-28T00:00:00Z"), "last", "month")).toBe(false);
    expect(isBoundaryDayFunction(d("2028-02-29T00:00:00Z"), "last", "month")).toBe(true);
  });

  it("checks the first and last day of the UTC year", () => {
    expect(isBoundaryDayFunction(d("2026-01-01T12:00:00Z"), "first", "year")).toBe(true);
    expect(isBoundaryDayFunction(d("2026-02-01T00:00:00Z"), "first", "year")).toBe(false);
    expect(isBoundaryDayFunction(d("2026-12-31T23:59:59Z"), "last", "year")).toBe(true);
    expect(isBoundaryDayFunction(d("2026-12-30T23:59:59Z"), "last", "year")).toBe(false);
  });

  it("accepts an ISO string (e.g. a static date after serialize())", () => {
    expect(isBoundaryDayFunction("2026-03-01T00:00:00.000Z" as unknown as ValueType, "first", "month")).toBe(true);
  });

  it("returns undefined for an invalid date, edge or unit", () => {
    expect(isBoundaryDayFunction(undefined, "first", "month")).toBeUndefined();
    expect(isBoundaryDayFunction(d("2026-03-01T00:00:00Z"), "middle" as BoundaryEdge, "month")).toBeUndefined();
    expect(isBoundaryDayFunction(d("2026-03-01T00:00:00Z"), "first", "day" as BoundaryUnit)).toBeUndefined();
  });
});
