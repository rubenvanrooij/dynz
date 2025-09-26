import { describe, expect, it } from "vitest";
import { REFERENCE_TYPE, ref } from "../../reference";
import { custom } from "./index";

describe("custom rule", () => {
  it("should create custom rule with name only", () => {
    const rule = custom("validateUniqueEmail");

    expect(rule).toEqual({
      type: "custom",
      name: "validateUniqueEmail",
      params: {},
    });
  });

  it("should create custom rule with name and params", () => {
    const rule = custom("validateLength", {
      min: 5,
      max: 50,
    });

    expect(rule).toEqual({
      type: "custom",
      name: "validateLength",
      params: {
        min: 5,
        max: 50,
      },
    });
  });

  it("should create custom rule with reference parameters", () => {
    const rule = custom("validateGreaterThan", {
      threshold: ref("minimumValue"),
      strict: true,
    });

    expect(rule).toEqual({
      type: "custom",
      name: "validateGreaterThan",
      params: {
        threshold: {
          _type: REFERENCE_TYPE,
          path: "minimumValue",
        },
        strict: true,
      },
    });
  });

  it("should create custom rule with complex parameters", () => {
    const rule = custom("validateBusinessRules", {
      category: "finance",
      limits: {
        daily: ref("$.settings.dailyLimit"),
        monthly: ref("$.settings.monthlyLimit"),
      },
      allowOverride: false,
      notificationEmail: "admin@company.com",
    });

    expect(rule.name).toBe("validateBusinessRules");
    expect(rule.params.category).toBe("finance");
    expect(rule.params.limits.daily).toEqual({
      _type: REFERENCE_TYPE,
      path: "$.settings.dailyLimit",
    });
    expect(rule.params.allowOverride).toBe(false);
  });

  it("should handle empty params object", () => {
    const rule = custom("simpleValidation", {});

    expect(rule).toEqual({
      type: "custom",
      name: "simpleValidation",
      params: {},
    });
  });
});
