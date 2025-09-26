import { describe, expect, it } from "vitest";
import { REFERENCE_TYPE, ref } from "../../reference";
import { before } from "./index";

describe("before rule", () => {
  it("should create before rule with Date object", () => {
    const dateObj = new Date("2024-12-31");
    const rule = before(dateObj);

    expect(rule).toEqual({
      type: "before",
      before: dateObj,
    });
  });

  it("should create before rule with reference", () => {
    const reference = ref("$.endDate");
    const rule = before(reference);

    expect(rule).toEqual({
      type: "before",
      before: {
        _type: REFERENCE_TYPE,
        path: "$.endDate",
      },
    });
  });

  it("should create before rule with custom code", () => {
    const rule = before(new Date("2024-01-01"), "CUSTOM_BEFORE_ERROR");

    expect(rule).toEqual({
      type: "before",
      before: new Date("2024-01-01"),
      code: "CUSTOM_BEFORE_ERROR",
    });
  });
});
