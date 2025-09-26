import { describe, expect, it } from "vitest";
import { REFERENCE_TYPE, ref } from "../../reference";
import { after } from "./index";

describe("after rule", () => {
  it("should create after rule with Date object", () => {
    const dateObj = new Date("2024-01-01");
    const rule = after(dateObj);

    expect(rule).toEqual({
      type: "after",
      after: dateObj,
    });
  });

  it("should create after rule with reference", () => {
    const reference = ref("$.startDate");
    const rule = after(reference);

    expect(rule).toEqual({
      type: "after",
      after: {
        _type: REFERENCE_TYPE,
        path: "$.startDate",
      },
    });
  });

  it("should create after rule with custom code", () => {
    const rule = after(new Date("2024-06-15"), "CUSTOM_AFTER_ERROR");

    expect(rule).toEqual({
      type: "after",
      after: new Date("2024-06-15"),
      code: "CUSTOM_AFTER_ERROR",
    });
  });
});
