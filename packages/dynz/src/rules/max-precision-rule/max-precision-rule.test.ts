import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type NumberSchema, number } from "../../schemas";
import type { Context } from "../../types";
import { maxPrecision, maxPrecisionRule } from "./index";

describe("maxPrecision rule", () => {
  it("should create maxPrecision rule with number value", () => {
    const rule = maxPrecision(v(2));

    expect(rule).toEqual({
      type: "max_precision",
      maxPrecision: v(2),
    });
  });

  it("should create maxPrecision rule with reference", () => {
    const reference = ref("$.maxPrecision");
    const rule = maxPrecision(reference);

    expect(rule).toEqual({
      type: "max_precision",
      maxPrecision: { type: REFERENCE_TYPE, path: "$.maxPrecision" },
    });
  });

  it("should create maxPrecision rule with custom code", () => {
    const rule = maxPrecision(v(3), "PRECISION_TOO_HIGH");

    expect(rule).toEqual({
      type: "max_precision",
      maxPrecision: v(3),
      code: "PRECISION_TOO_HIGH",
    });
  });
});

describe("maxPrecisionRule validator", () => {
  const mockContext = {} as unknown as Context<NumberSchema>;
  const mockSchema = number();

  it("should return undefined when precision is within maximum", () => {
    const rule = maxPrecision(v(2));

    const result = maxPrecisionRule({
      rule,
      value: 1.23,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when precision exceeds maximum", async () => {
    const rule = maxPrecision(v(2));

    const result = await maxPrecisionRule({
      rule,
      value: 1.23456,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_precision");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("precision");
  });

  it("should return undefined when resolved maxPrecision is undefined", () => {
    const rule = maxPrecision(undefined);

    const result = maxPrecisionRule({
      rule,
      value: 1.23456,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle larger threshold correctly", () => {
    const rule = maxPrecision(v(4));

    const result = maxPrecisionRule({
      rule,
      value: 1.3243,
      path: "piValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = maxPrecision(v(1));

    const result = await maxPrecisionRule({
      rule,
      value: 1.32432,
      path: "$.price",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.price");
    expect(result?.message).toContain("precision of 5");
    expect(result?.message).toContain("maximum precision of 1");
    expect(result?.code).toBe("max_precision");
  });

  it("should handle whole numbers correctly", () => {
    const rule = maxPrecision(v(2));

    const result = maxPrecisionRule({
      rule,
      value: 42,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when precision equals maximum", () => {
    const rule = maxPrecision(v(3));

    const result = maxPrecisionRule({
      rule,
      value: 1.234,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
