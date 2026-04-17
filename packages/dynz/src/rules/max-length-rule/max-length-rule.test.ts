import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { buildMaxLengthRule, maxLengthRule } from "./index";

describe("maxLength rule", () => {
  it("should create maxLength rule with number value", () => {
    const rule = buildMaxLengthRule(v(10));

    expect(rule).toEqual({
      type: "max_length",
      max: v(10),
    });
  });

  it("should create maxLength rule with reference", () => {
    const reference = ref("$.maxLength");
    const rule = buildMaxLengthRule(reference);

    expect(rule).toEqual({
      type: "max_length",
      max: { type: REFERENCE_TYPE, path: "$.maxLength" },
    });
  });

  it("should create maxLength rule with custom code", () => {
    const rule = buildMaxLengthRule(v(50), "CUSTOM_MAX_LENGTH_ERROR");

    expect(rule).toEqual({
      type: "max_length",
      max: v(50),
      code: "CUSTOM_MAX_LENGTH_ERROR",
    });
  });
});

describe("maxLengthRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  it("should return undefined when value is below maximum length", () => {
    const rule = buildMaxLengthRule(v(10));

    const result = maxLengthRule({
      rule,
      value: "short",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value exceeds maximum length", async () => {
    const rule = buildMaxLengthRule(v(5));

    const result = await maxLengthRule({
      rule,
      value: "this is way too long",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_length");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have a maximum length of");
  });

  it("should return undefined when resolved max is undefined", () => {
    const rule = buildMaxLengthRule(undefined);

    const result = maxLengthRule({
      rule,
      value: "this is too long",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle larger threshold correctly", () => {
    const rule = buildMaxLengthRule(v(20));

    const result = maxLengthRule({
      rule,
      value: "short text",
      path: "currentValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = buildMaxLengthRule(v(8));

    const result = await maxLengthRule({
      rule,
      value: "this text is definitely too long",
      path: "$.username",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.username");
    expect(result?.message).toContain("should have a maximum length of 8");
    expect(result?.code).toBe("max_length");
  });

  it("should return undefined when value equals maximum length", () => {
    const rule = buildMaxLengthRule(v(7));

    const result = maxLengthRule({
      rule,
      value: "exactly",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle empty string correctly", () => {
    const rule = buildMaxLengthRule(v(5));

    const result = maxLengthRule({
      rule,
      value: "",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
