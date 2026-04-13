import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { minLength, minLengthRule } from "./index";

describe("minLength rule", () => {
  it("should create minLength rule with number value", () => {
    const rule = minLength(v(5));

    expect(rule).toEqual({
      type: "min_length",
      min: v(5),
    });
  });

  it("should create minLength rule with reference", () => {
    const reference = ref("$.minLength");
    const rule = minLength(reference);

    expect(rule).toEqual({
      type: "min_length",
      min: { type: REFERENCE_TYPE, path: "$.minLength" },
    });
  });

  it("should create minLength rule with custom code", () => {
    const rule = minLength(v(3), "CUSTOM_MIN_LENGTH_ERROR");

    expect(rule).toEqual({
      type: "min_length",
      min: v(3),
      code: "CUSTOM_MIN_LENGTH_ERROR",
    });
  });
});

describe("minLengthRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  it("should return undefined when value meets minimum length requirement", () => {
    const rule = minLength(v(5));

    const result = minLengthRule({
      rule,
      value: "hello world",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value is below minimum length", async () => {
    const rule = minLength(v(10));

    const result = await minLengthRule({
      rule,
      value: "short",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_length");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have at least a length of");
  });

  it("should return undefined when resolved min is undefined", () => {
    const rule = minLength(undefined);

    const result = minLengthRule({
      rule,
      value: "test",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle larger threshold correctly", () => {
    const rule = minLength(v(3));

    const result = minLengthRule({
      rule,
      value: "testing",
      path: "currentValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = minLength(v(15));

    const result = await minLengthRule({
      rule,
      value: "short text",
      path: "$.description",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.description");
    expect(result?.message).toContain("should have at least a length of 15");
    expect(result?.code).toBe("min_length");
  });

  it("should return undefined when value equals minimum length", () => {
    const rule = minLength(v(7));

    const result = minLengthRule({
      rule,
      value: "exactly",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle empty string correctly", async () => {
    const rule = minLength(v(1));

    const result = await minLengthRule({
      rule,
      value: "",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_length");
  });
});
