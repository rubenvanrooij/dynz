import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type NumberSchema, number } from "../../schemas";
import type { Context } from "../../types";
import { min, minRule } from "./index";

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

describe("min rule", () => {
  it("should create min rule with number value", () => {
    const rule = min(5);

    expect(rule).toEqual({
      type: "min",
      min: 5,
    });
  });

  it("should create min rule with decimal number", () => {
    const rule = min(3.14);

    expect(rule).toEqual({
      type: "min",
      min: 3.14,
    });
  });

  it("should create min rule with zero", () => {
    const rule = min(0);

    expect(rule).toEqual({
      type: "min",
      min: 0,
    });
  });

  it("should create min rule with negative number", () => {
    const rule = min(-10);

    expect(rule).toEqual({
      type: "min",
      min: -10,
    });
  });

  it("should create min rule with reference", () => {
    const reference = ref("minimumValue");
    const rule = min(reference);

    expect(rule).toEqual({
      type: "min",
      min: {
        _type: REFERENCE_TYPE,
        path: "minimumValue",
      },
    });
  });

  it("should create min rule with cross-field reference", () => {
    const rule = min(ref("$.startDate"));

    expect(rule).toEqual({
      type: "min",
      min: {
        _type: REFERENCE_TYPE,
        path: "$.startDate",
      },
    });
  });

  it("should create min rule with custom code", () => {
    const rule = min(5, "CUSTOM_MIN_ERROR");

    expect(rule).toEqual({
      type: "min",
      min: 5,
      code: "CUSTOM_MIN_ERROR",
    });
  });
});

describe("minRule validator", () => {
  const mockContext = {} as unknown as Context<NumberSchema>;
  const mockSchema = number();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value meets minimum requirement", async () => {
    const rule = min(10);

    vi.mocked(unpackRef).mockReturnValue({ value: 10 } as ReturnType<typeof unpackRef>);

    const result = minRule({
      rule,
      value: 15,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value is below minimum", async () => {
    const rule = min(10);

    vi.mocked(unpackRef).mockReturnValue({ value: 10 } as ReturnType<typeof unpackRef>);

    const result = minRule({
      rule,
      value: 5,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("min");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("should be at least");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = min(10);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = minRule({
      rule,
      value: 5,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = min(ref("minThreshold"));

    vi.mocked(unpackRef).mockReturnValue({ value: 20 } as ReturnType<typeof unpackRef>);

    const result = minRule({
      rule,
      value: 25,
      path: "currentValue",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = min(100);

    vi.mocked(unpackRef).mockReturnValue({ value: 100 } as ReturnType<typeof unpackRef>);

    const result = minRule({
      rule,
      value: 50,
      path: "$.score",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.score");
    expect(result?.message).toContain("should be at least 100");
    expect(result?.code).toBe("min");
  });

  it("should return undefined when value equals minimum", async () => {
    const rule = min(42);

    vi.mocked(unpackRef).mockReturnValue({ value: 42 } as ReturnType<typeof unpackRef>);

    const result = minRule({
      rule,
      value: 42,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
