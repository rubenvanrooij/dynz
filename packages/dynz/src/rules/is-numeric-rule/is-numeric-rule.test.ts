import { beforeEach, describe, expect, it, vi } from "vitest";
import { type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { isNumeric, isNumericRule } from "./index";

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

  it("should create isNumeric rule with custom code", () => {
    const rule = isNumeric("NOT_NUMERIC");

    expect(rule).toEqual({
      type: "is_numeric",
      code: "NOT_NUMERIC",
    });
  });
});

describe("isNumericRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each(["123", "0", "-123", "123.45", "-123.45", "0.001", "1e10", "1.5e-10"])(
    "should return undefined for valid '%s' numeric strings",
    async (value) => {
      const rule = isNumeric();

      const result = isNumericRule({
        rule,
        value: value,
        path: "testPath",
        schema: mockSchema,
        context: mockContext,
      });

      expect(result).toBeUndefined();
    }
  );

  it.each(["abc", "123abc", "abc123", "", "12.34.56", "++123", "--123", "NaN"])(
    "should return error for '%s' strings",
    async (val) => {
      const rule = isNumeric();

      const result = isNumericRule({
        rule,
        value: val,
        path: "testPath",
        schema: mockSchema,
        context: mockContext,
      });

      expect(result).toBeDefined();
      expect(result?.code).toBe("is_numeric");
      expect(result?.message).toContain("not a valid numeric value");
    }
  );

  it("should include correct error message format", async () => {
    const rule = isNumeric();

    const result = isNumericRule({
      rule,
      value: "not-a-number",
      path: "$.quantity",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("not-a-number");
    expect(result?.message).toContain("not a valid numeric value");
    expect(result?.code).toBe("is_numeric");
  });

  it("should handle edge cases with whitespace", async () => {
    const rule = isNumeric();

    const spaceWithNumberResult = isNumericRule({
      rule,
      value: " 123 ",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    const singleSpaceResult = isNumericRule({
      rule,
      value: " ",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(spaceWithNumberResult).toBeUndefined();
    expect(singleSpaceResult).toBeUndefined(); // Single space converts to 0
  });

  it("should handle Infinity values as valid", async () => {
    const rule = isNumeric();

    const infinityResult = isNumericRule({
      rule,
      value: "Infinity",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    const negativeInfinityResult = isNumericRule({
      rule,
      value: "-Infinity",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(infinityResult).toBeUndefined();
    expect(negativeInfinityResult).toBeUndefined();
  });

  it("should handle zero correctly", async () => {
    const rule = isNumeric();

    const result = isNumericRule({
      rule,
      value: "0",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle decimal numbers correctly", async () => {
    const rule = isNumeric();

    const result = isNumericRule({
      rule,
      value: "0.5",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
