import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type NumberSchema, number } from "../../schemas";
import type { Context } from "../../types";
import { max, maxRule } from "./index";

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

describe("max rule", () => {
  it("should create max rule with number value", () => {
    const rule = max(100);

    expect(rule).toEqual({
      type: "max",
      max: 100,
    });
  });

  it("should create max rule with decimal number", () => {
    const rule = max(99.99);

    expect(rule).toEqual({
      type: "max",
      max: 99.99,
    });
  });

  it("should create max rule with reference", () => {
    const reference = ref("maximumAllowed");
    const rule = max(reference);

    expect(rule).toEqual({
      type: "max",
      max: {
        _type: REFERENCE_TYPE,
        path: "maximumAllowed",
      },
    });
  });

  it("should create max rule with array reference", () => {
    const rule = max(ref("limits[0]"));

    expect(rule).toEqual({
      type: "max",
      max: {
        _type: REFERENCE_TYPE,
        path: "limits[0]",
      },
    });
  });

  it("should create max rule with custom code", () => {
    const rule = max(50, "CUSTOM_MAX_ERROR");

    expect(rule).toEqual({
      type: "max",
      max: 50,
      code: "CUSTOM_MAX_ERROR",
    });
  });
});

describe("maxRule validator", () => {
  const mockContext = {} as unknown as Context<NumberSchema>;
  const mockSchema = number();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value is below maximum", async () => {
    const rule = max(100);

    vi.mocked(unpackRef).mockReturnValue({ value: 100 } as ReturnType<typeof unpackRef>);

    const result = maxRule({
      rule,
      value: 50,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value exceeds maximum", async () => {
    const rule = max(100);

    vi.mocked(unpackRef).mockReturnValue({ value: 100 } as ReturnType<typeof unpackRef>);

    const result = maxRule({
      rule,
      value: 150,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("max");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should have a maximum of");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = max(100);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = maxRule({
      rule,
      value: 150,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = max(ref("maxThreshold"));

    vi.mocked(unpackRef).mockReturnValue({ value: 200 } as ReturnType<typeof unpackRef>);

    const result = maxRule({
      rule,
      value: 180,
      path: "currentValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = max(75);

    vi.mocked(unpackRef).mockReturnValue({ value: 75 } as ReturnType<typeof unpackRef>);

    const result = maxRule({
      rule,
      value: 100,
      path: "$.percentage",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.percentage");
    expect(result?.message).toContain("should have a maximum of 75");
    expect(result?.code).toBe("max");
  });

  it("should return undefined when value equals maximum", async () => {
    const rule = max(42);

    vi.mocked(unpackRef).mockReturnValue({ value: 42 } as ReturnType<typeof unpackRef>);

    const result = maxRule({
      rule,
      value: 42,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
