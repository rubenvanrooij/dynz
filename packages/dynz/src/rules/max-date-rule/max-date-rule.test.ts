import { describe, expect, it } from "vitest";
import { maxDate } from "./index";

describe("maxDate rule", () => {
  it("should create maxDate rule", () => {
    const dateObj = new Date("2024-12-31");
    const rule = maxDate(dateObj);

    expect(rule).toEqual({
      type: "max_date",
      max: dateObj,
    });
  });
});
