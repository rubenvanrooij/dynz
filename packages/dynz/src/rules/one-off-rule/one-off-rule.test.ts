import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type NumberSchema, number, type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { type OneOfRule, oneOf, oneOfRule } from "./index";

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

describe("oneOf rule", () => {
  it("should create oneOf rule with string values", () => {
    const rule = oneOf(["apple", "banana", "orange"]);

    expect(rule).toEqual({
      type: "one_of",
      values: ["apple", "banana", "orange"],
    });
  });

  it("should create oneOf rule with number values", () => {
    const rule = oneOf([1, 2, 3, 5, 8]);

    expect(rule).toEqual({
      type: "one_of",
      values: [1, 2, 3, 5, 8],
    });
  });

  it("should create oneOf rule with mixed values", () => {
    const rule = oneOf(["active", 1, "inactive", 0]);

    expect(rule).toEqual({
      type: "one_of",
      values: ["active", 1, "inactive", 0],
    });
  });

  it("should create oneOf rule with custom code", () => {
    const rule = oneOf(["red", "green", "blue"], "INVALID_COLOR");

    expect(rule).toEqual({
      type: "one_of",
      values: ["red", "green", "blue"],
      code: "INVALID_COLOR",
    });
  });
});

describe("oneOfRule validator", () => {
  const mockStringContext = {} as unknown as Context<StringSchema>;
  const mockNumberContext = {} as unknown as Context<NumberSchema>;
  const mockStringSchema = string();
  const mockNumberSchema = number();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when string value is in allowed values", async () => {
    const rule = oneOf(["apple", "banana", "orange"]);

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === "apple") return { value: "apple" } as ReturnType<typeof unpackRef>;
      if (value === "banana") return { value: "banana" } as ReturnType<typeof unpackRef>;
      if (value === "orange") return { value: "orange" } as ReturnType<typeof unpackRef>;
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

    const result = oneOfRule({
      rule,
      value: "banana",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when number value is in allowed values", async () => {
    const rule = oneOf([1, 2, 3, 5, 8]);

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === 1) return { value: 1 } as ReturnType<typeof unpackRef>;
      if (value === 2) return { value: 2 } as ReturnType<typeof unpackRef>;
      if (value === 3) return { value: 3 } as ReturnType<typeof unpackRef>;
      if (value === 5) return { value: 5 } as ReturnType<typeof unpackRef>;
      if (value === 8) return { value: 8 } as ReturnType<typeof unpackRef>;
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

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
    const rule = oneOf(["apple", "banana", "orange"]);

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === "apple") return { value: "apple" } as ReturnType<typeof unpackRef>;
      if (value === "banana") return { value: "banana" } as ReturnType<typeof unpackRef>;
      if (value === "orange") return { value: "orange" } as ReturnType<typeof unpackRef>;
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

    const result = oneOfRule({
      rule,
      value: "grape",
      path: "testPath",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("one_of");
    expect(result?.message).toContain("grape");
    expect(result?.message).toContain("is not a one of");
    expect(result?.values).toEqual(["apple", "banana", "orange"]);
  });

  it("should return error when number value is not in allowed values", async () => {
    const rule = oneOf([1, 2, 3, 5, 8]);

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === 1) return { value: 1 } as ReturnType<typeof unpackRef>;
      if (value === 2) return { value: 2 } as ReturnType<typeof unpackRef>;
      if (value === 3) return { value: 3 } as ReturnType<typeof unpackRef>;
      if (value === 5) return { value: 5 } as ReturnType<typeof unpackRef>;
      if (value === 8) return { value: 8 } as ReturnType<typeof unpackRef>;
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

    const result = oneOfRule({
      rule,
      value: 4,
      path: "testPath",
      schema: mockNumberSchema,
      context: mockNumberContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("one_of");
    expect(result?.message).toContain("4");
    expect(result?.message).toContain("is not a one of");
  });

  it("should handle reference objects correctly", async () => {
    const allowedColorsRef = ref("allowedColors");
    const rule = oneOf([allowedColorsRef]);

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === allowedColorsRef) return { value: "red" } as ReturnType<typeof unpackRef>;
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

    const result = oneOfRule({
      rule,
      value: "red",
      path: "currentColor",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = oneOf(["small", "medium", "large"]);

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === "small") return { value: "small" } as ReturnType<typeof unpackRef>;
      if (value === "medium") return { value: "medium" } as ReturnType<typeof unpackRef>;
      if (value === "large") return { value: "large" } as ReturnType<typeof unpackRef>;
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

    const result = oneOfRule({
      rule,
      value: "extra-large",
      path: "$.size",
      schema: mockStringSchema,
      context: mockStringContext,
    });

    expect(result?.message).toContain("extra-large");
    expect(result?.message).toContain("is not a one of");
    expect(result?.code).toBe("one_of");
    expect(result?.values).toEqual(["small", "medium", "large"]);
  });

  it("should handle empty allowed values array", async () => {
    const rule = oneOf([]);

    const result = oneOfRule({
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

  it("should handle mixed type values correctly", async () => {
    const rule = oneOf(["active", 1, "inactive", 0]) as unknown as OneOfRule<number[]>;

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === "active") return { value: "active" } as ReturnType<typeof unpackRef>;
      if (value === 1) return { value: 1 } as ReturnType<typeof unpackRef>;
      if (value === "inactive") return { value: "inactive" } as ReturnType<typeof unpackRef>;
      if (value === 0) return { value: 0 } as ReturnType<typeof unpackRef>;
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

    const result = oneOfRule({
      rule,
      value: 1,
      path: "status",
      schema: mockNumberSchema,
      context: mockNumberContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle single allowed value", async () => {
    const rule = oneOf(["only-option"]);

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === "only-option") return { value: "only-option" } as ReturnType<typeof unpackRef>;
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

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
