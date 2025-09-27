import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type ObjectSchema, object } from "../../schemas";
import type { Context } from "../../types";
import { minEntries, minEntriesRule } from "./index";

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

describe("minEntries rule", () => {
  it("should create minEntries rule with number value", () => {
    const rule = minEntries(3);

    expect(rule).toEqual({
      type: "min_entries",
      min: 3,
    });
  });

  it("should create minEntries rule with reference", () => {
    const reference = ref("$.minEntries");
    const rule = minEntries(reference);

    expect(rule).toEqual({
      type: "min_entries",
      min: {
        _type: REFERENCE_TYPE,
        path: "$.minEntries",
      },
    });
  });

  it("should create minEntries rule with custom code", () => {
    const rule = minEntries(2, "INSUFFICIENT_ENTRIES");

    expect(rule).toEqual({
      type: "min_entries",
      min: 2,
      code: "INSUFFICIENT_ENTRIES",
    });
  });
});

describe("minEntriesRule validator", () => {
  const mockContext = {} as unknown as Context<ObjectSchema<never>>;
  const mockSchema = object({
    fields: {},
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when object has more entries than minimum", async () => {
    const rule = minEntries(2);
    const testObject = { name: "John", age: 30, city: "New York" };

    vi.mocked(unpackRef).mockReturnValue({ value: 2 } as ReturnType<typeof unpackRef>);

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when object has exactly minimum entries", async () => {
    const rule = minEntries(2);
    const testObject = { name: "John", age: 30 };

    vi.mocked(unpackRef).mockReturnValue({ value: 2 } as ReturnType<typeof unpackRef>);

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
    const rule = minEntries(3);
    const testObject = { name: "John" };

    vi.mocked(unpackRef).mockReturnValue({ value: 3 } as ReturnType<typeof unpackRef>);

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("min_entries");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have at least 3 entries");
    expect(result?.min).toBe(3);
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = minEntries(2);
    const testObject = { name: "John" };

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = minEntries(ref("minEntriesThreshold"));
    const testObject = { id: 1, name: "John", status: "active" };

    vi.mocked(unpackRef).mockReturnValue({ value: 2 } as ReturnType<typeof unpackRef>);

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "userObject",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = minEntries(5);
    const testObject = { name: "John", age: 30 };

    vi.mocked(unpackRef).mockReturnValue({ value: 5 } as ReturnType<typeof unpackRef>);

    const result = minEntriesRule({
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
    const rule = minEntries(1);
    const testObject = {};

    vi.mocked(unpackRef).mockReturnValue({ value: 1 } as ReturnType<typeof unpackRef>);

    const result = minEntriesRule({
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

  it("should return undefined when minimum is zero", async () => {
    const rule = minEntries(0);
    const testObject = {};

    vi.mocked(unpackRef).mockReturnValue({ value: 0 } as ReturnType<typeof unpackRef>);

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle object with nested properties correctly", async () => {
    const rule = minEntries(3);
    const testObject = {
      user: { name: "John", age: 30 },
      settings: { theme: "dark" },
      permissions: ["read", "write"],
    };

    vi.mocked(unpackRef).mockReturnValue({ value: 3 } as ReturnType<typeof unpackRef>);

    const result = minEntriesRule({
      rule,
      value: testObject,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle large objects correctly", async () => {
    const rule = minEntries(10);
    const testObject: Record<string, any> = {};
    for (let i = 0; i < 15; i++) {
      testObject[`field${i}`] = `value${i}`;
    }

    vi.mocked(unpackRef).mockReturnValue({ value: 10 } as ReturnType<typeof unpackRef>);

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
