import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, date } from "../../schemas";
import type { Context } from "../../types";
import { after, afterRule } from "./index";

vi.mock("../../reference", () => {
  return {
    ref: () => ({
      _type: REFERENCE_TYPE,
      path: "$.startDate",
    }),
    REFERENCE_TYPE: "MOCKED_REFERENCE_TYPE",
    unpackRef: vi.fn(),
  };
});

describe("after rule", () => {
  it("should create after rule with Date object", () => {
    const dateObj = new Date("2024-01-01");
    const rule = after(dateObj);

    expect(rule).toEqual({
      type: "after",
      after: dateObj,
    });
  });

  it("should create after rule with reference", () => {
    const reference = ref("$.startDate");
    const rule = after(reference);

    expect(rule).toEqual({
      type: "after",
      after: {
        _type: REFERENCE_TYPE,
        path: "$.startDate",
      },
    });
  });

  it("should create after rule with custom code", () => {
    const rule = after(new Date("2024-06-15"), "CUSTOM_AFTER_ERROR");

    expect(rule).toEqual({
      type: "after",
      after: new Date("2024-06-15"),
      code: "CUSTOM_AFTER_ERROR",
    });
  });
});

describe("afterRule validator", () => {
  const testDate = new Date("2024-01-01");
  const afterDate = new Date("2023-12-01");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value is after reference date", async () => {
    const rule = after(afterDate);

    vi.mocked(unpackRef).mockReturnValue({ value: afterDate } as ReturnType<typeof unpackRef>);

    const result = afterRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value is before reference date", async () => {
    const rule = after(new Date("2024-01-01"));

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-01-02") } as ReturnType<typeof unpackRef>);

    const result = afterRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("after");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("before");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = after(afterDate);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = afterRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = after(ref("otherDate"));
    const resolvedDate = new Date("2023-12-01");

    vi.mocked(unpackRef).mockReturnValue({ value: resolvedDate } as ReturnType<typeof unpackRef>);

    const result = afterRule({
      rule,
      value: testDate,
      path: "currentDate",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = after(afterDate);
    const testValue = new Date("2023-11-01");

    vi.mocked(unpackRef).mockReturnValue({ value: afterDate } as ReturnType<typeof unpackRef>);

    const result = afterRule({
      rule,
      value: testValue,
      path: "$.usebirthDate",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.usebirthDate");
    expect(result?.message).toContain("before");
    expect(result?.code).toBe("after");
  });
});
