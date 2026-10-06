import { describe, expect, it } from "vitest";
import { date, object, ref, startOf, validate } from "../../index";
import type { DateUnit } from "../../utils/date-utils";
import { endOfFunction } from "../end-of-function";
import { startOfFunction } from "./index";

describe("startOf function", () => {
  it("builds a serializable node with a static unit", () => {
    expect(startOf(ref("claimDate"), "month")).toEqual({ type: "start_of", value: ref("claimDate"), unit: "month" });
  });

  it("validates against the start of the month of another date", async () => {
    const schema = object({
      claimDate: date(),
      expenseDate: date().min(startOf(ref("claimDate"), "month")),
    });

    const claimDate = new Date("2026-03-20T12:00:00Z");

    expect(
      (await validate(schema, undefined, { claimDate, expenseDate: new Date("2026-03-01T00:00:00Z") })).success
    ).toBe(true);
    expect(
      (await validate(schema, undefined, { claimDate, expenseDate: new Date("2026-02-28T23:59:59Z") })).success
    ).toBe(false);
  });
});

const d = (iso: string) => new Date(iso);

describe("startOfFunction / endOfFunction", () => {
  const value = d("2026-01-31T23:30:00Z");

  it("returns the first moment of the UTC day, month and year", () => {
    expect(startOfFunction(value, "day")).toEqual(d("2026-01-31T00:00:00.000Z"));
    expect(startOfFunction(value, "month")).toEqual(d("2026-01-01T00:00:00.000Z"));
    expect(startOfFunction(value, "year")).toEqual(d("2026-01-01T00:00:00.000Z"));
  });

  it("returns the last moment of the UTC day, month and year", () => {
    expect(endOfFunction(value, "day")).toEqual(d("2026-01-31T23:59:59.999Z"));
    expect(endOfFunction(d("2028-02-10T00:00:00Z"), "month")).toEqual(d("2028-02-29T23:59:59.999Z"));
    expect(endOfFunction(value, "year")).toEqual(d("2026-12-31T23:59:59.999Z"));
  });

  it("returns undefined for an invalid date or unit", () => {
    expect(startOfFunction(undefined, "month")).toBeUndefined();
    expect(endOfFunction(value, "quarter" as DateUnit)).toBeUndefined();
  });
});
