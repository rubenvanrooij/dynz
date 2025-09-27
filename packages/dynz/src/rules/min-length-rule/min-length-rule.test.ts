import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { minLength, minLengthRule } from "./index";

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

describe("minLength rule", () => {
  it("should create minLength rule with number value", () => {
    const rule = minLength(5);

    expect(rule).toEqual({
      type: "min_length",
      min: 5,
    });
  });

  it("should create minLength rule with reference", () => {
    const reference = ref("$.minLength");
    const rule = minLength(reference);

    expect(rule).toEqual({
      type: "min_length",
      min: {
        _type: REFERENCE_TYPE,
        path: "$.minLength",
      },
    });
  });

  it("should create minLength rule with custom code", () => {
    const rule = minLength(3, "CUSTOM_MIN_LENGTH_ERROR");

    expect(rule).toEqual({
      type: "min_length",
      min: 3,
      code: "CUSTOM_MIN_LENGTH_ERROR",
    });
  });
});

describe("minLengthRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value meets minimum length requirement", async () => {
    const rule = minLength(5);

    vi.mocked(unpackRef).mockReturnValue({ value: 5 } as ReturnType<typeof unpackRef>);

    const result = minLengthRule({
      rule,
      value: "hello world",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value is below minimum length", async () => {
    const rule = minLength(10);

    vi.mocked(unpackRef).mockReturnValue({ value: 10 } as ReturnType<typeof unpackRef>);

    const result = minLengthRule({
      rule,
      value: "short",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("min_length");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have at least a length of");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = minLength(5);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = minLengthRule({
      rule,
      value: "test",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = minLength(ref("minLengthThreshold"));

    vi.mocked(unpackRef).mockReturnValue({ value: 3 } as ReturnType<typeof unpackRef>);

    const result = minLengthRule({
      rule,
      value: "testing",
      path: "currentValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = minLength(15);

    vi.mocked(unpackRef).mockReturnValue({ value: 15 } as ReturnType<typeof unpackRef>);

    const result = minLengthRule({
      rule,
      value: "short text",
      path: "$.description",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.description");
    expect(result?.message).toContain("should have at least a length of 15");
    expect(result?.code).toBe("min_length");
  });

  it("should return undefined when value equals minimum length", async () => {
    const rule = minLength(7);

    vi.mocked(unpackRef).mockReturnValue({ value: 7 } as ReturnType<typeof unpackRef>);

    const result = minLengthRule({
      rule,
      value: "exactly",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle empty string correctly", async () => {
    const rule = minLength(1);

    vi.mocked(unpackRef).mockReturnValue({ value: 1 } as ReturnType<typeof unpackRef>);

    const result = minLengthRule({
      rule,
      value: "",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_length");
  });
});
