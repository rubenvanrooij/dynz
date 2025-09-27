import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type ObjectSchema, object } from "../../schemas";
import type { Context } from "../../types";
import { maxEntries, maxEntriesRule } from "./index";

vi.mock("../../reference", () => {
  return {
    ref: (path: string) => ({
      _type: REFERENCE_TYPE,
      path: path,
    }),
    REFERENCE_TYPE: "MOCKED_REFERENCE_TYPE",
    unpackRef: vi.fn(),
  };
});

describe("maxEntries rule", () => {
  it("should create maxEntries rule with number value", () => {
    const rule = maxEntries(5);

    expect(rule).toEqual({
      type: "max_entries",
      max: 5,
    });
  });

  it("should create maxEntries rule with reference", () => {
    const reference = ref("$.maxEntries");
    const rule = maxEntries(reference);

    expect(rule).toEqual({
      type: "max_entries",
      max: {
        _type: REFERENCE_TYPE,
        path: "$.maxEntries",
      },
    });
  });

  it("should create maxEntries rule with custom code", () => {
    const rule = maxEntries(3, "TOO_MANY_ENTRIES");

    expect(rule).toEqual({
      type: "max_entries",
      max: 3,
      code: "TOO_MANY_ENTRIES",
    });
  });
});

describe("maxEntriesRule validator", () => {
  const mockContext = {} as unknown as Context<ObjectSchema<never>>;
  const mockSchema = object({
    fields: {},
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when object has fewer entries than maximum", async () => {
    const rule = maxEntries(5);
    const testObject = { name: "John", age: 30, city: "New York" };

    vi.mocked(unpackRef).mockReturnValue({ value: 5 } as ReturnType<typeof unpackRef>);

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when object has exactly maximum entries", async () => {
    const rule = maxEntries(2);
    const testObject = { name: "John", age: 30 };

    vi.mocked(unpackRef).mockReturnValue({ value: 2 } as ReturnType<typeof unpackRef>);

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
    const rule = maxEntries(2);
    const testObject = { name: "John", age: 30, city: "New York" };

    vi.mocked(unpackRef).mockReturnValue({ value: 2 } as ReturnType<typeof unpackRef>);

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("max_entries");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have a maximum of 2 entries");
    expect(result?.max).toBe(2);
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = maxEntries(2);
    const testObject = { name: "John", age: 30, city: "New York" };

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = maxEntries(ref("maxEntriesThreshold"));
    const testObject = { id: 1, name: "John" };

    vi.mocked(unpackRef).mockReturnValue({ value: 5 } as ReturnType<typeof unpackRef>);

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "userObject",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = maxEntries(1);
    const testObject = { name: "John", age: 30 };

    vi.mocked(unpackRef).mockReturnValue({ value: 1 } as ReturnType<typeof unpackRef>);

    const result = maxEntriesRule({
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

  it("should handle empty object correctly", async () => {
    const rule = maxEntries(5);
    const testObject = {};

    vi.mocked(unpackRef).mockReturnValue({ value: 5 } as ReturnType<typeof unpackRef>);

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
    const rule = maxEntries(0);
    const testObject = { name: "John" };

    vi.mocked(unpackRef).mockReturnValue({ value: 0 } as ReturnType<typeof unpackRef>);

    const result = maxEntriesRule({
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

  it("should return undefined when zero maximum and empty object", async () => {
    const rule = maxEntries(0);
    const testObject = {};

    vi.mocked(unpackRef).mockReturnValue({ value: 0 } as ReturnType<typeof unpackRef>);

    const result = maxEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle object with nested properties correctly", async () => {
    const rule = maxEntries(2);
    const testObject = {
      user: { name: "John", age: 30 },
      settings: { theme: "dark" },
    };

    vi.mocked(unpackRef).mockReturnValue({ value: 2 } as ReturnType<typeof unpackRef>);

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
    const rule = maxEntries(5);
    const testObject: Record<string, any> = {};
    for (let i = 0; i < 10; i++) {
      testObject[`field${i}`] = `value${i}`;
    }

    vi.mocked(unpackRef).mockReturnValue({ value: 5 } as ReturnType<typeof unpackRef>);

    const result = maxEntriesRule({
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

  it("should handle single entry object at limit", async () => {
    const rule = maxEntries(1);
    const testObject = { onlyField: "value" };

    vi.mocked(unpackRef).mockReturnValue({ value: 1 } as ReturnType<typeof unpackRef>);

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
