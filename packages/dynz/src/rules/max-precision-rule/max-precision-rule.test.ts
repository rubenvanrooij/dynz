import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type NumberSchema, number } from "../../schemas";
import type { Context } from "../../types";
import { maxPrecision, maxPrecisionRule } from "./index";

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

describe("maxPrecision rule", () => {
  it("should create maxPrecision rule with number value", () => {
    const rule = maxPrecision(2);

    expect(rule).toEqual({
      type: "max_precision",
      maxPrecision: 2,
    });
  });

  it("should create maxPrecision rule with reference", () => {
    const reference = ref("$.maxPrecision");
    const rule = maxPrecision(reference);

    expect(rule).toEqual({
      type: "max_precision",
      maxPrecision: {
        _type: REFERENCE_TYPE,
        path: "$.maxPrecision",
      },
    });
  });

  it("should create maxPrecision rule with custom code", () => {
    const rule = maxPrecision(3, "PRECISION_TOO_HIGH");

    expect(rule).toEqual({
      type: "max_precision",
      maxPrecision: 3,
      code: "PRECISION_TOO_HIGH",
    });
  });
});

describe("maxPrecisionRule validator", () => {
  const mockContext = {} as unknown as Context<NumberSchema>;
  const mockSchema = number();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when precision is within maximum", async () => {
    const rule = maxPrecision(2);

    vi.mocked(unpackRef).mockReturnValue({ value: 2 } as ReturnType<typeof unpackRef>);

    const result = maxPrecisionRule({
      rule,
      value: 1.23,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when precision exceeds maximum", async () => {
    const rule = maxPrecision(2);

    vi.mocked(unpackRef).mockReturnValue({ value: 2 } as ReturnType<typeof unpackRef>);

    const result = maxPrecisionRule({
      rule,
      value: 1.23456,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("max_precision");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("precision");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = maxPrecision(2);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = maxPrecisionRule({
      rule,
      value: 1.23456,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = maxPrecision(ref("maxPrecisionThreshold"));

    vi.mocked(unpackRef).mockReturnValue({ value: 4 } as ReturnType<typeof unpackRef>);

    const result = maxPrecisionRule({
      rule,
      value: 1.3243,
      path: "piValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = maxPrecision(1);

    vi.mocked(unpackRef).mockReturnValue({ value: 1 } as ReturnType<typeof unpackRef>);

    const result = maxPrecisionRule({
      rule,
      value: 1.32432,
      path: "$.price",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.price");
    expect(result?.message).toContain("precision of 5");
    expect(result?.message).toContain("maximum precision of 1");
    expect(result?.code).toBe("max_precision");
  });

  it("should handle whole numbers correctly", async () => {
    const rule = maxPrecision(2);

    vi.mocked(unpackRef).mockReturnValue({ value: 2 } as ReturnType<typeof unpackRef>);

    const result = maxPrecisionRule({
      rule,
      value: 42,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return undefined when precision equals maximum", async () => {
    const rule = maxPrecision(3);

    vi.mocked(unpackRef).mockReturnValue({ value: 3 } as ReturnType<typeof unpackRef>);

    const result = maxPrecisionRule({
      rule,
      value: 1.234,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
