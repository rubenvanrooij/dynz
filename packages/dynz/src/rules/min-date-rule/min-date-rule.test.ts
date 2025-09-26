import { describe, expect, it } from "vitest";
import { minDate } from "./index";

describe("minDate rule", () => {
  it("should create minDate rule", () => {
    const dateObj = new Date("2024-01-01");
    const rule = minDate(dateObj);

    expect(rule).toEqual({
      type: "min_date",
      min: dateObj,
    });
  });
});
