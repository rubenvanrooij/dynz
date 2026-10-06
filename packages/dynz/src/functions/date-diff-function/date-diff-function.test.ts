import { describe, expect, it } from "vitest";
import { date, dateDiff, lte, object, ref, v, validate } from "../../index";
import type { ValueType } from "../../types";
import { dateDiffFunction } from "./index";

describe("dateDiff function", () => {
  it("builds a serializable node with a static unit", () => {
    expect(dateDiff(ref("endDate"), ref("startDate"), "year")).toEqual({
      type: "date_diff",
      left: ref("endDate"),
      right: ref("startDate"),
      unit: "year",
    });
  });

  it("limits the span between two dates in calendar months", async () => {
    const schema = object({
      startDate: date(),
      endDate: date().satisfies(lte(dateDiff(ref("endDate"), ref("startDate"), "month"), v(12))),
    });

    const startDate = new Date("2026-01-15T00:00:00Z");

    expect((await validate(schema, undefined, { startDate, endDate: new Date("2027-01-31T00:00:00Z") })).success).toBe(
      true
    );
    expect((await validate(schema, undefined, { startDate, endDate: new Date("2027-02-01T00:00:00Z") })).success).toBe(
      false
    );
  });
});

const d = (iso: string) => new Date(iso);

describe("dateDiffFunction", () => {
  it("counts calendar units between two dates (left - right)", () => {
    expect(dateDiffFunction(d("2026-03-01T00:00:00Z"), d("2026-02-28T23:59:59Z"), "day")).toBe(1);
    expect(dateDiffFunction(d("2026-02-01T00:00:00Z"), d("2026-01-31T23:59:59Z"), "month")).toBe(1);
    expect(dateDiffFunction(d("2027-01-01T00:00:00Z"), d("2026-12-31T23:59:59Z"), "year")).toBe(1);
    expect(dateDiffFunction(d("2026-01-15T00:00:00Z"), d("2026-04-15T00:00:00Z"), "month")).toBe(-3);
  });

  it("returns undefined when either side is not a date", () => {
    expect(dateDiffFunction(undefined, d("2026-01-01T00:00:00Z"), "day")).toBeUndefined();
    expect(dateDiffFunction(d("2026-01-01T00:00:00Z"), "nope" as unknown as ValueType, "day")).toBeUndefined();
  });
});
