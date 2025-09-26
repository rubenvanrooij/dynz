import { describe, expect, it } from "vitest";
import { REFERENCE_TYPE, ref } from "../../reference";
import { max } from "./index";

describe("max rule", () => {
  it("should create max rule with number value", () => {
    const rule = max(100);

    expect(rule).toEqual({
      type: "max",
      max: 100,
    });
  });

  it("should create max rule with decimal number", () => {
    const rule = max(99.99);

    expect(rule).toEqual({
      type: "max",
      max: 99.99,
    });
  });

  it("should create max rule with reference", () => {
    const reference = ref("maximumAllowed");
    const rule = max(reference);

    expect(rule).toEqual({
      type: "max",
      max: {
        _type: REFERENCE_TYPE,
        path: "maximumAllowed",
      },
    });
  });

  it("should create max rule with array reference", () => {
    const rule = max(ref("limits[0]"));

    expect(rule).toEqual({
      type: "max",
      max: {
        _type: REFERENCE_TYPE,
        path: "limits[0]",
      },
    });
  });
});
