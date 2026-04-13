import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type NumberSchema, number, type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { notOneOf, notOneOfRule } from "./index";

describe("notOneOf rule", () => {
  it("should create notOneOf rule with string values", () => {
    const rule = notOneOf([v("apple"), v("banana"), v("orange")]);

    expect(rule).toEqual({
      type: "not_one_of",
      values: [v("apple"), v("banana"), v("orange")],
    });
  });

  it("should create notOneOf rule with number values", () => {
    const rule = notOneOf([v(1), v(2), v(3), v(5), v(8)]);

    expect(rule).toEqual({
      type: "not_one_of",
      values: [v(1), v(2), v(3), v(5), v(8)],
    });
  });

  it("should create notOneOf rule with reference value", () => {
    const rule = notOneOf([ref("blockedValue")]);

    expect(rule).toEqual({
      type: "not_one_of",
      values: [{ type: REFERENCE_TYPE, path: "blockedValue" }],
    });
  });

  it("should create notOneOf rule with custom code", () => {
    const rule = notOneOf([v("red"), v("green"), v("blue")], "INVALID_COLOR");

    expect(rule).toEqual({
      type: "not_one_of",
      values: [v("red"), v("green"), v("blue")],
      code: "INVALID_COLOR",
    });
  });
});

describe("notOneOfRule validator", () => {
  const mockStringContext = {} as unknown as Context<StringSchema>;
  const mockNumberContext = {} as unknown as Context<NumberSchema>;
  const mockStringSchema = string();
  const mockNumberSchema = number();

  it("should return undefined when string value is not in blocked values", () => {
    const rule = notOneOf([v("apple"), v("banana"), v("orange")]);

    const result = notOneOfRule({
      rule,
      value: "grape",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when number value is not in blocked values", () => {
    const rule = notOneOf([v(1), v(2), v(3), v(5), v(8)]);

    const result = notOneOfRule({
      rule,
      value: 4,
      path: "testPath",
      schema: mockNumberSchema,
      context: mockNumberContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when string value is in blocked values", async () => {
    const rule = notOneOf([v("apple"), v("banana"), v("orange")]);

    const result = await notOneOfRule({
      rule,
      value: "banana",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("not_one_of");
    expect(result?.message).toContain("banana");
    expect(result?.values).toEqual(["apple", "banana", "orange"]);
  });

  it("should return error when number value is in blocked values", async () => {
    const rule = notOneOf([v(1), v(2), v(3), v(5), v(8)]);

    const result = await notOneOfRule({
      rule,
      value: 5,
      path: "testPath",
      schema: mockNumberSchema,
      context: mockNumberContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("not_one_of");
    expect(result?.message).toContain("5");
  });

  it("should return undefined when blocked values are empty", () => {
    const rule = notOneOf([]);

    const result = notOneOfRule({
      rule,
      value: "any-value",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle single blocked value", async () => {
    const rule = notOneOf([v("blocked")]);

    const result = await notOneOfRule({
      rule,
      value: "blocked",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("not_one_of");
  });
});
