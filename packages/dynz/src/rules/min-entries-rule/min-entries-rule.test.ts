import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type ObjectSchema, object } from "../../schemas";
import type { Context } from "../../types";
import { minEntries, minEntriesRule } from "./index";

describe("minEntries rule", () => {
  it("should create minEntries rule with number value", () => {
    const rule = minEntries(v(3));

    expect(rule).toEqual({
      type: "min_entries",
      min: v(3),
    });
  });

  it("should create minEntries rule with reference", () => {
    const reference = ref("$.minEntries");
    const rule = minEntries(reference);

    expect(rule).toEqual({
      type: "min_entries",
      min: { type: REFERENCE_TYPE, path: "$.minEntries" },
    });
  });

  it("should create minEntries rule with custom code", () => {
    const rule = minEntries(v(2), "INSUFFICIENT_ENTRIES");

    expect(rule).toEqual({
      type: "min_entries",
      min: v(2),
      code: "INSUFFICIENT_ENTRIES",
    });
  });
});

describe("minEntriesRule validator", () => {
  const mockContext = {} as unknown as Context<ObjectSchema<never>>;
  const mockSchema = object({
    fields: {},
  });

  it("should return undefined when object has more entries than minimum", () => {
    const rule = minEntries(v(2));
    const testObject = { name: "John", age: 30, city: "New York" };

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when object has exactly minimum entries", () => {
    const rule = minEntries(v(2));
    const testObject = { name: "John", age: 30 };

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when object has fewer entries than minimum", async () => {
    const rule = minEntries(v(3));
    const testObject = { name: "John" };

    const result = await minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_entries");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have at least 3 entries");
    expect(result?.min).toBe(3);
  });

  it("should return undefined when resolved min is undefined", () => {
    const rule = minEntries(undefined);
    const testObject = { name: "John" };

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = minEntries(v(5));
    const testObject = { name: "John", age: 30 };

    const result = await minEntriesRule({
      rule,
      value: testObject,
      path: "$.userProfile",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.userProfile");
    expect(result?.message).toContain("should have at least 5 entries");
    expect(result?.code).toBe("min_entries");
    expect(result?.min).toBe(5);
  });

  it("should handle empty object correctly", async () => {
    const rule = minEntries(v(1));
    const testObject = {};

    const result = await minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_entries");
    expect(result?.message).toContain("should have at least 1 entries");
  });

  it("should return undefined when minimum is zero", () => {
    const rule = minEntries(v(0));
    const testObject = {};

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle object with nested properties correctly", () => {
    const rule = minEntries(v(3));
    const testObject = {
      user: { name: "John", age: 30 },
      settings: { theme: "dark" },
      permissions: ["read", "write"],
    };

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle large objects correctly", () => {
    const rule = minEntries(v(10));
    const testObject: Record<string, unknown> = {};
    for (let i = 0; i < 15; i++) {
      testObject[`field${i}`] = `value${i}`;
    }

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
