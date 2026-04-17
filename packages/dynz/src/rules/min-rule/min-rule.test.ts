import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type NumberSchema, number } from "../../schemas";
import type { Context } from "../../types";
import { buildMinRule, minRule } from "./index";

describe("min rule", () => {
  it("should create min rule with number value", () => {
    const rule = buildMinRule(v(5));

    expect(rule).toEqual({ type: "min", min: v(5) });
  });

  it("should create min rule with decimal number", () => {
    const rule = buildMinRule(v(3.14));

    expect(rule).toEqual({ type: "min", min: v(3.14) });
  });

  it("should create min rule with zero", () => {
    const rule = buildMinRule(v(0));

    expect(rule).toEqual({ type: "min", min: v(0) });
  });

  it("should create min rule with negative number", () => {
    const rule = buildMinRule(v(-10));

    expect(rule).toEqual({ type: "min", min: v(-10) });
  });

  it("should create min rule with reference", () => {
    const reference = ref("minimumValue");
    const rule = buildMinRule(reference);

    expect(rule).toEqual({
      type: "min",
      min: { type: REFERENCE_TYPE, path: "minimumValue" },
    });
  });

  it("should create min rule with cross-field reference", () => {
    const rule = buildMinRule(ref("$.startDate"));

    expect(rule).toEqual({
      type: "min",
      min: { type: REFERENCE_TYPE, path: "$.startDate" },
    });
  });

  it("should create min rule with custom code", () => {
    const rule = buildMinRule(v(5), "CUSTOM_MIN_ERROR");

    expect(rule).toEqual({ type: "min", min: v(5), code: "CUSTOM_MIN_ERROR" });
  });
});

describe("minRule validator", () => {
  const mockContext = {} as unknown as Context<NumberSchema>;
  const mockSchema = number();

  it("should return undefined when value meets minimum requirement", async () => {
    const rule = buildMinRule(v(10));

    const result = await minRule({
      rule,
      value: 15,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value is below minimum", async () => {
    const rule = buildMinRule(v(10));

    const result = await minRule({
      rule,
      value: 5,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should be at least");
  });

  it("should return undefined when resolved min is undefined", async () => {
    // undefined ParamaterValue resolves to undefined, skipping validation
    const rule = buildMinRule(undefined);

    const result = await minRule({
      rule,
      value: 5,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    // Test min with a specific resolved value
    const rule = buildMinRule(v(20));

    const result = await minRule({
      rule,
      value: 25,
      path: "currentValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = buildMinRule(v(100));

    const result = await minRule({
      rule,
      value: 50,
      path: "$.score",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.score");
    expect(result?.message).toContain("should be at least 100");
    expect(result?.code).toBe("min");
  });

  it("should return undefined when value equals minimum", async () => {
    const rule = buildMinRule(v(42));

    const result = await minRule({
      rule,
      value: 42,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
