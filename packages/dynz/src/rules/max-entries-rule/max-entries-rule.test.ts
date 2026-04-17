import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type ObjectSchema, object } from "../../schemas";
import type { Context } from "../../types";
import { buildMaxEntriesRule, maxEntriesRule } from "./index";

describe("maxEntries rule", () => {
  it("should create maxEntries rule with number value", () => {
    const rule = buildMaxEntriesRule(v(5));

    expect(rule).toEqual({
      type: "max_entries",
      max: v(5),
    });
  });

  it("should create maxEntries rule with reference", () => {
    const reference = ref("$.maxEntries");
    const rule = buildMaxEntriesRule(reference);

    expect(rule).toEqual({
      type: "max_entries",
      max: { type: REFERENCE_TYPE, path: "$.maxEntries" },
    });
  });

  it("should create maxEntries rule with custom code", () => {
    const rule = buildMaxEntriesRule(v(3), "TOO_MANY_ENTRIES");

    expect(rule).toEqual({
      type: "max_entries",
      max: v(3),
      code: "TOO_MANY_ENTRIES",
    });
  });
});

describe("maxEntriesRule validator", () => {
  const mockContext = {} as unknown as Context<ObjectSchema<never>>;
  const mockSchema = object({});

  it("should return undefined when object has fewer entries than maximum", () => {
    const rule = buildMaxEntriesRule(v(5));
    const testObject = { name: "John", age: 30, city: "New York" };

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when object has exactly maximum entries", () => {
    const rule = buildMaxEntriesRule(v(2));
    const testObject = { name: "John", age: 30 };

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when object has more entries than maximum", async () => {
    const rule = buildMaxEntriesRule(v(2));
    const testObject = { name: "John", age: 30, city: "New York" };

    const result = await maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_entries");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have a maximum of 2 entries");
    expect(result?.max).toBe(2);
  });

  it("should return undefined when resolved max is undefined", () => {
    const rule = buildMaxEntriesRule(undefined);
    const testObject = { name: "John", age: 30, city: "New York" };

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = buildMaxEntriesRule(v(1));
    const testObject = { name: "John", age: 30 };

    const result = await maxEntriesRule({
      rule,
      value: testObject,
      path: "$.userProfile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.userProfile");
    expect(result?.message).toContain("should have a maximum of 1 entries");
    expect(result?.code).toBe("max_entries");
    expect(result?.max).toBe(1);
  });

  it("should handle empty object correctly", () => {
    const rule = buildMaxEntriesRule(v(5));
    const testObject = {};

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle zero maximum correctly", async () => {
    const rule = buildMaxEntriesRule(v(0));
    const testObject = { name: "John" };

    const result = await maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_entries");
    expect(result?.message).toContain("should have a maximum of 0 entries");
  });

  it("should return undefined when zero maximum and empty object", () => {
    const rule = buildMaxEntriesRule(v(0));
    const testObject = {};

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle object with nested properties correctly", () => {
    const rule = buildMaxEntriesRule(v(2));
    const testObject = {
      user: { name: "John", age: 30 },
      settings: { theme: "dark" },
    };

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle large objects correctly", async () => {
    const rule = buildMaxEntriesRule(v(5));
    const testObject: Record<string, unknown> = {};
    for (let i = 0; i < 10; i++) {
      testObject[`field${i}`] = `value${i}`;
    }

    const result = await maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_entries");
    expect(result?.message).toContain("should have a maximum of 5 entries");
  });

  it("should handle single entry object at limit", () => {
    const rule = buildMaxEntriesRule(v(1));
    const testObject = { onlyField: "value" };

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
