import { describe, expect, it } from "vitest";
import { REFERENCE_TYPE, ref } from "../../reference";
import { min } from "./index";

describe("min rule", () => {
  it("should create min rule with number value", () => {
    const rule = min(5);

    expect(rule).toEqual({
      type: "min",
      min: 5,
    });
  });

  it("should create min rule with decimal number", () => {
    const rule = min(3.14);

    expect(rule).toEqual({
      type: "min",
      min: 3.14,
    });
  });

  it("should create min rule with zero", () => {
    const rule = min(0);

    expect(rule).toEqual({
      type: "min",
      min: 0,
    });
  });

  it("should create min rule with negative number", () => {
    const rule = min(-10);

    expect(rule).toEqual({
      type: "min",
      min: -10,
    });
  });

  it.skip("should create min rule with date string", () => {
    // const rule = minDate("2024-01-01");
    // expect(rule).toEqual({
    //   type: 'min'_DATE,
    //   min: "2024-01-01",
    // });
  });

  it("should create min rule with reference", () => {
    const reference = ref("minimumValue");
    const rule = min(reference);

    expect(rule).toEqual({
      type: "min",
      min: {
        _type: REFERENCE_TYPE,
        path: "minimumValue",
      },
    });
  });

  it("should create min rule with cross-field reference", () => {
    const rule = min(ref("$.startDate"));

    expect(rule).toEqual({
      type: "min",
      min: {
        _type: REFERENCE_TYPE,
        path: "$.startDate",
      },
    });
  });
});
