import { describe, expect, it } from "vitest";
import { date, endOf, object, ref, validate } from "../../index";

describe("endOf function", () => {
  it("builds a serializable node with a static unit", () => {
    expect(endOf(new Date("2026-03-20T00:00:00Z"), "year")).toEqual({
      type: "end_of",
      value: { type: "st", value: new Date("2026-03-20T00:00:00Z") },
      unit: "year",
    });
  });

  it("validates against the end of the year of another date", async () => {
    const schema = object({
      startDate: date(),
      payDate: date().max(endOf(ref("startDate"), "year")),
    });

    const startDate = new Date("2026-03-20T12:00:00Z");

    expect(
      (await validate(schema, undefined, { startDate, payDate: new Date("2026-12-31T23:59:59.999Z") })).success
    ).toBe(true);
    expect((await validate(schema, undefined, { startDate, payDate: new Date("2027-01-01T00:00:00Z") })).success).toBe(
      false
    );
  });
});
