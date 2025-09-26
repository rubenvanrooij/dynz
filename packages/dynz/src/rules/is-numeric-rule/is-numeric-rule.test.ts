import { describe, expect, it } from "vitest";
import { isNumeric } from "./index";

describe("isNumeric rule", () => {
  it("should create isNumeric rule", () => {
    const rule = isNumeric();

    expect(rule).toEqual({
      type: "is_numeric",
    });
  });

  it("should create isNumeric rule without parameters", () => {
    const rule = isNumeric();

    expect(rule.type).toBe("is_numeric");
    expect(Object.keys(rule)).toHaveLength(2);
  });
});
