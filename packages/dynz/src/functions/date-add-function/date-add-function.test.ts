import { describe, expect, it } from "vitest";
import { date, dateAdd, number, object, ref, v, validate } from "../../index";
import type { ValueType } from "../../types";
import type { DateUnit } from "../../utils/date-utils";
import { dateAddFunction } from "./index";

describe("dateAdd function", () => {
  it("builds a serializable node with a static unit", () => {
    expect(dateAdd(ref("startDate"), 3, "month")).toEqual({
      type: "date_add",
      value: ref("startDate"),
      amount: v(3),
      unit: "month",
    });
  });

  it("validates a date at least N months after another date", async () => {
    const schema = object({
      startDate: date(),
      endDate: date().min(dateAdd(ref("startDate"), 3, "month")),
    });

    const startDate = new Date("2026-01-31T00:00:00Z");

    expect((await validate(schema, undefined, { startDate, endDate: new Date("2026-04-30T00:00:00Z") })).success).toBe(
      true
    );
    expect((await validate(schema, undefined, { startDate, endDate: new Date("2026-04-29T00:00:00Z") })).success).toBe(
      false
    );
  });

  it("resolves the amount from a reference", async () => {
    const schema = object({
      startDate: date(),
      termInDays: number(),
      endDate: date().max(dateAdd(ref("startDate"), ref("termInDays"), "day")),
    });

    const startDate = new Date("2026-03-01T00:00:00Z");

    expect(
      (await validate(schema, undefined, { startDate, termInDays: 14, endDate: new Date("2026-03-15T00:00:00Z") }))
        .success
    ).toBe(true);
    expect(
      (await validate(schema, undefined, { startDate, termInDays: 14, endDate: new Date("2026-03-16T00:00:00Z") }))
        .success
    ).toBe(false);
  });
});

const d = (iso: string) => new Date(iso);

describe("dateAddFunction", () => {
  it("adds days, months and years", () => {
    expect(dateAddFunction(d("2026-03-15T10:00:00Z"), 20, "day")).toEqual(d("2026-04-04T10:00:00Z"));
    expect(dateAddFunction(d("2026-03-15T10:00:00Z"), 3, "month")).toEqual(d("2026-06-15T10:00:00Z"));
    expect(dateAddFunction(d("2026-03-15T10:00:00Z"), 2, "year")).toEqual(d("2028-03-15T10:00:00Z"));
  });

  it("subtracts with a negative amount", () => {
    expect(dateAddFunction(d("2026-03-15T10:00:00Z"), -3, "month")).toEqual(d("2025-12-15T10:00:00Z"));
  });

  it("clamps to the last day of a shorter target month", () => {
    expect(dateAddFunction(d("2026-01-31T12:00:00Z"), 1, "month")).toEqual(d("2026-02-28T12:00:00Z"));
    expect(dateAddFunction(d("2028-01-31T12:00:00Z"), 1, "month")).toEqual(d("2028-02-29T12:00:00Z"));
    expect(dateAddFunction(d("2028-02-29T12:00:00Z"), 1, "year")).toEqual(d("2029-02-28T12:00:00Z"));
  });

  it("does not shift across a UTC month boundary because of the local time zone", () => {
    expect(dateAddFunction(d("2026-01-31T23:30:00Z"), 1, "month")).toEqual(d("2026-02-28T23:30:00Z"));
  });

  it("coerces a numeric string amount", () => {
    expect(dateAddFunction(d("2026-03-15T10:00:00Z"), "1" as unknown as ValueType, "day")).toEqual(
      d("2026-03-16T10:00:00Z")
    );
  });

  it("returns undefined for an invalid date, amount or unit", () => {
    expect(dateAddFunction(undefined, 1, "day")).toBeUndefined();
    expect(dateAddFunction(d("2026-03-15T10:00:00Z"), undefined, "day")).toBeUndefined();
    expect(dateAddFunction(d("2026-03-15T10:00:00Z"), Number.NaN, "day")).toBeUndefined();
    expect(dateAddFunction(d("2026-03-15T10:00:00Z"), 1, "week" as DateUnit)).toBeUndefined();
  });

  it("returns a plain Date", () => {
    expect(Object.getPrototypeOf(dateAddFunction(d("2026-03-15T10:00:00Z"), 1, "day"))).toBe(Date.prototype);
  });
});
