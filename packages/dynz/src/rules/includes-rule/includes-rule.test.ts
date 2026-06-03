import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { array, type StringSchema, string } from "../../schemas";
import type { Context, Schema } from "../../types";
import { buildIncludesRule, includesRule } from "./index";

describe("includes rule builder", () => {
  it("should create includes rule with string value", () => {
    const rule = buildIncludesRule(v("foo"));

    expect(rule).toEqual({ type: "includes", includes: v("foo") });
  });

  it("should create includes rule with reference", () => {
    const rule = buildIncludesRule(ref("$.substring"));

    expect(rule).toEqual({ type: "includes", includes: { type: REFERENCE_TYPE, path: "$.substring" } });
  });

  it("should create includes rule with custom code", () => {
    const rule = buildIncludesRule(v("foo"), "MUST_INCLUDE_FOO");

    expect(rule).toEqual({ type: "includes", includes: v("foo"), code: "MUST_INCLUDE_FOO" });
  });
});

describe("includesRule validator - string", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  it("should return undefined when string contains the value", () => {
    const rule = buildIncludesRule(v("foo"));

    expect(
      includesRule({ rule, value: "foobar", path: "test", schema: mockSchema, context: mockContext })
    ).toBeUndefined();
  });

  it("should return error when string does not contain the value", async () => {
    const rule = buildIncludesRule(v("baz"));

    const result = await includesRule({
      rule,
      value: "foobar",
      path: "test",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("includes");
    expect(result?.message).toContain("foobar");
    expect(result?.message).toContain("baz");
    expect(result?.includes).toBe("baz");
  });

  it("should return undefined when resolved value is undefined", () => {
    const rule = buildIncludesRule(undefined);

    expect(
      includesRule({ rule, value: "foobar", path: "test", schema: mockSchema, context: mockContext })
    ).toBeUndefined();
  });
});

describe("includesRule validator - array", () => {
  const mockContext = {} as unknown as Context<Schema>;
  const mockSchema = array(string());

  it("should return undefined when array contains the value", () => {
    const rule = buildIncludesRule(v("banana"));

    expect(
      includesRule({
        rule,
        value: ["apple", "banana", "cherry"],
        path: "test",
        schema: mockSchema,
        context: mockContext,
      })
    ).toBeUndefined();
  });

  it("should return error when array does not contain the value", async () => {
    const rule = buildIncludesRule(v("grape"));

    const result = await includesRule({
      rule,
      value: ["apple", "banana"],
      path: "test",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("includes");
    expect(result?.includes).toBe("grape");
  });

  it("should return error when array is empty", async () => {
    const rule = buildIncludesRule(v("foo"));

    const result = await includesRule({ rule, value: [], path: "test", schema: mockSchema, context: mockContext });

    expect(result).toBeDefined();
    expect(result?.code).toBe("includes");
  });
});
