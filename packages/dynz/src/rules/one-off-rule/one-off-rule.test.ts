import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type NumberSchema, number, type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { oneOf, oneOfRule } from "./index";

describe("oneOf rule", () => {
  it("should create oneOf rule with string values", () => {
    const rule = oneOf([v("apple"), v("banana"), v("orange")]);

    expect(rule).toEqual({
      type: "one_of",
      values: [v("apple"), v("banana"), v("orange")],
    });
  });

  it("should create oneOf rule with number values", () => {
    const rule = oneOf([v(1), v(2), v(3), v(5), v(8)]);

    expect(rule).toEqual({
      type: "one_of",
      values: [v(1), v(2), v(3), v(5), v(8)],
    });
  });

  it("should create oneOf rule with reference value", () => {
    const rule = oneOf([ref("allowedValue")]);

    expect(rule).toEqual({
      type: "one_of",
      values: [{ type: REFERENCE_TYPE, path: "allowedValue" }],
    });
  });

  it("should create oneOf rule with custom code", () => {
    const rule = oneOf([v("red"), v("green"), v("blue")], "INVALID_COLOR");

    expect(rule).toEqual({
      type: "one_of",
      values: [v("red"), v("green"), v("blue")],
      code: "INVALID_COLOR",
    });
  });
});

describe("oneOfRule validator", () => {
  const mockStringContext = {} as unknown as Context<StringSchema>;
  const mockNumberContext = {} as unknown as Context<NumberSchema>;
  const mockStringSchema = string();
  const mockNumberSchema = number();

  it("should return undefined when string value is in allowed values", () => {
    const rule = oneOf([v("apple"), v("banana"), v("orange")]);

    const result = oneOfRule({
      rule,
      value: "banana",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when number value is in allowed values", () => {
    const rule = oneOf([v(1), v(2), v(3), v(5), v(8)]);

    const result = oneOfRule({
      rule,
      value: 5,
      path: "testPath",
      schema: mockNumberSchema,
      context: mockNumberContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when string value is not in allowed values", async () => {
    const rule = oneOf([v("apple"), v("banana"), v("orange")]);

    const result = await oneOfRule({
      rule,
      value: "grape",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("one_of");
    expect(result?.message).toContain("grape");
    expect(result?.message).toContain("is not one of");
    expect(result?.values).toEqual(["apple", "banana", "orange"]);
  });

  it("should return error when number value is not in allowed values", async () => {
    const rule = oneOf([v(1), v(2), v(3), v(5), v(8)]);

    const result = await oneOfRule({
      rule,
      value: 4,
      path: "testPath",
      schema: mockNumberSchema,
      context: mockNumberContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("one_of");
    expect(result?.message).toContain("4");
    expect(result?.message).toContain("is not one of");
  });

  it("should include correct error message format", async () => {
    const rule = oneOf([v("small"), v("medium"), v("large")]);

    const result = await oneOfRule({
      rule,
      value: "extra-large",
      path: "$.size",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result?.message).toContain("extra-large");
    expect(result?.message).toContain("is not one of");
    expect(result?.code).toBe("one_of");
    expect(result?.values).toEqual(["small", "medium", "large"]);
  });

  it("should handle empty allowed values array", async () => {
    const rule = oneOf([]);

    const result = await oneOfRule({
      rule,
      value: "any-value",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("one_of");
    expect(result?.message).toContain("any-value");
  });

  it("should handle single allowed value", () => {
    const rule = oneOf([v("only-option")]);

    const result = oneOfRule({
      rule,
      value: "only-option",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeUndefined();
  });
});
