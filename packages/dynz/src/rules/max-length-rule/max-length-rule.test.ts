import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { maxLength, maxLengthRule } from "./index";

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

describe("maxLength rule", () => {
  it("should create maxLength rule with number value", () => {
    const rule = maxLength(10);

    expect(rule).toEqual({
      type: "max_length",
      max: 10,
    });
  });

  it("should create maxLength rule with reference", () => {
    const reference = ref("$.maxLength");
    const rule = maxLength(reference);

    expect(rule).toEqual({
      type: "max_length",
      max: {
        _type: REFERENCE_TYPE,
        path: "$.maxLength",
      },
    });
  });

  it("should create maxLength rule with custom code", () => {
    const rule = maxLength(50, "CUSTOM_MAX_LENGTH_ERROR");

    expect(rule).toEqual({
      type: "max_length",
      max: 50,
      code: "CUSTOM_MAX_LENGTH_ERROR",
    });
  });
});

describe("maxLengthRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value is below maximum length", async () => {
    const rule = maxLength(10);

    vi.mocked(unpackRef).mockReturnValue({ value: 10 } as ReturnType<typeof unpackRef>);

    const result = maxLengthRule({
      rule,
      value: "short",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value exceeds maximum length", async () => {
    const rule = maxLength(5);

    vi.mocked(unpackRef).mockReturnValue({ value: 5 } as ReturnType<typeof unpackRef>);

    const result = maxLengthRule({
      rule,
      value: "this is way too long",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("max_length");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have a maximum length of");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = maxLength(5);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = maxLengthRule({
      rule,
      value: "this is too long",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = maxLength(ref("maxLengthThreshold"));

    vi.mocked(unpackRef).mockReturnValue({ value: 20 } as ReturnType<typeof unpackRef>);

    const result = maxLengthRule({
      rule,
      value: "short text",
      path: "currentValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = maxLength(8);

    vi.mocked(unpackRef).mockReturnValue({ value: 8 } as ReturnType<typeof unpackRef>);

    const result = maxLengthRule({
      rule,
      value: "this text is definitely too long",
      path: "$.username",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.username");
    expect(result?.message).toContain("should have a maximum length of 8");
    expect(result?.code).toBe("max_length");
  });

  it("should return undefined when value equals maximum length", async () => {
    const rule = maxLength(7);

    vi.mocked(unpackRef).mockReturnValue({ value: 7 } as ReturnType<typeof unpackRef>);

    const result = maxLengthRule({
      rule,
      value: "exactly",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle empty string correctly", async () => {
    const rule = maxLength(5);

    vi.mocked(unpackRef).mockReturnValue({ value: 5 } as ReturnType<typeof unpackRef>);

    const result = maxLengthRule({
      rule,
      value: "",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
