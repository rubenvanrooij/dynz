import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { array, type StringSchema, string } from "../../schemas";
import type { Context, Schema } from "../../types";
import { buildNotIncludesRule, notIncludesRule } from "./index";

describe("notIncludes rule builder", () => {
  it("should create notIncludes rule with string value", () => {
    const rule = buildNotIncludesRule(v("foo"));

    expect(rule).toEqual({ type: "not_includes", notIncludes: v("foo") });
  });

  it("should create notIncludes rule with reference", () => {
    const rule = buildNotIncludesRule(ref("$.substring"));

    expect(rule).toEqual({ type: "not_includes", notIncludes: { type: REFERENCE_TYPE, path: "$.substring" } });
  });

  it("should create notIncludes rule with custom code", () => {
    const rule = buildNotIncludesRule(v("foo"), "MUST_NOT_INCLUDE_FOO");

    expect(rule).toEqual({ type: "not_includes", notIncludes: v("foo"), code: "MUST_NOT_INCLUDE_FOO" });
  });
});

describe("notIncludesRule validator - string", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  it("should return undefined when string does not contain the value", () => {
    const rule = buildNotIncludesRule(v("baz"));

    expect(
      notIncludesRule({ rule, value: "foobar", path: "test", schema: mockSchema, context: mockContext })
    ).toBeUndefined();
  });

  it("should return error when string contains the value", async () => {
    const rule = buildNotIncludesRule(v("foo"));

    const result = await notIncludesRule({
      rule,
      value: "foobar",
      path: "test",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("not_includes");
    expect(result?.message).toContain("foobar");
    expect(result?.message).toContain("foo");
    expect(result?.notIncludes).toBe("foo");
  });

  it("should return undefined when resolved value is undefined", () => {
    const rule = buildNotIncludesRule(undefined);

    expect(
      notIncludesRule({ rule, value: "foobar", path: "test", schema: mockSchema, context: mockContext })
    ).toBeUndefined();
  });
});

describe("notIncludesRule validator - array", () => {
  const mockContext = {} as unknown as Context<Schema>;
  const mockSchema = array(string());

  it("should return undefined when array does not contain the value", () => {
    const rule = buildNotIncludesRule(v("grape"));

    expect(
      notIncludesRule({ rule, value: ["apple", "banana"], path: "test", schema: mockSchema, context: mockContext })
    ).toBeUndefined();
  });

  it("should return error when array contains the value", async () => {
    const rule = buildNotIncludesRule(v("banana"));

    const result = await notIncludesRule({
      rule,
      value: ["apple", "banana", "cherry"],
      path: "test",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("not_includes");
    expect(result?.notIncludes).toBe("banana");
  });

  it("should return undefined when array is empty", () => {
    const rule = buildNotIncludesRule(v("foo"));

    expect(
      notIncludesRule({ rule, value: [], path: "test", schema: mockSchema, context: mockContext })
    ).toBeUndefined();
  });
});
