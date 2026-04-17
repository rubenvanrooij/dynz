import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type NumberSchema, number } from "../../schemas";
import type { Context } from "../../types";
import { buildMaxRule, maxRule } from "./index";

describe("max rule", () => {
  it("should create max rule with number value", () => {
    const rule = buildMaxRule(v(100));

    expect(rule).toEqual({
      type: "max",
      max: v(100),
    });
  });

  it("should create max rule with decimal number", () => {
    const rule = buildMaxRule(v(99.99));

    expect(rule).toEqual({
      type: "max",
      max: v(99.99),
    });
  });

  it("should create max rule with reference", () => {
    const reference = ref("maximumAllowed");
    const rule = buildMaxRule(reference);

    expect(rule).toEqual({
      type: "max",
      max: { type: REFERENCE_TYPE, path: "maximumAllowed" },
    });
  });

  it("should create max rule with array reference", () => {
    const rule = buildMaxRule(ref("limits[0]"));

    expect(rule).toEqual({
      type: "max",
      max: { type: REFERENCE_TYPE, path: "limits[0]" },
    });
  });

  it("should create max rule with custom code", () => {
    const rule = buildMaxRule(v(50), "CUSTOM_MAX_ERROR");

    expect(rule).toEqual({
      type: "max",
      max: v(50),
      code: "CUSTOM_MAX_ERROR",
    });
  });
});

describe("maxRule validator", () => {
  const mockContext = {} as unknown as Context<NumberSchema>;
  const mockSchema = number();

  it("should return undefined when value is below maximum", () => {
    const rule = buildMaxRule(v(100));

    const result = maxRule({
      rule,
      value: 50,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value exceeds maximum", async () => {
    const rule = buildMaxRule(v(100));

    const result = await maxRule({
      rule,
      value: 150,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have a maximum of");
  });

  it("should return undefined when resolved max is undefined", () => {
    const rule = buildMaxRule(undefined);

    const result = maxRule({
      rule,
      value: 150,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", () => {
    const rule = buildMaxRule(v(200));

    const result = maxRule({
      rule,
      value: 180,
      path: "currentValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = buildMaxRule(v(75));

    const result = await maxRule({
      rule,
      value: 100,
      path: "$.percentage",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.percentage");
    expect(result?.message).toContain("should have a maximum of 75");
    expect(result?.code).toBe("max");
  });

  it("should return undefined when value equals maximum", () => {
    const rule = buildMaxRule(v(42));

    const result = maxRule({
      rule,
      value: 42,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
