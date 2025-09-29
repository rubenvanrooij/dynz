import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, date } from "../../schemas";
import type { Context } from "../../types";
import { before, beforeRule } from "./index";

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

describe("before rule", () => {
  it("should create before rule with Date object", () => {
    const dateObj = new Date("2024-12-31");
    const rule = before(dateObj);

    expect(rule).toEqual({
      type: "before",
      before: dateObj,
    });
  });

  it("should create before rule with reference", () => {
    const reference = ref("$.endDate");
    const rule = before(reference);

    expect(rule).toEqual({
      type: "before",
      before: {
        _type: REFERENCE_TYPE,
        path: "$.endDate",
      },
    });
  });

  it("should create before rule with custom code", () => {
    const rule = before(new Date("2024-01-01"), "CUSTOM_BEFORE_ERROR");

    expect(rule).toEqual({
      type: "before",
      before: new Date("2024-01-01"),
      code: "CUSTOM_BEFORE_ERROR",
    });
  });
});

describe("beforeRule validator", () => {
  const testDate = new Date("2024-01-01");
  const beforeDate = new Date("2024-12-31");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value is before reference date", async () => {
    const rule = before(beforeDate);

    vi.mocked(unpackRef).mockReturnValue({ value: beforeDate } as ReturnType<typeof unpackRef>);

    const result = beforeRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value is after reference date", async () => {
    const rule = before(new Date("2023-12-31"));

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2023-12-30") } as ReturnType<typeof unpackRef>);

    const result = beforeRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("before");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("after");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = before(beforeDate);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = beforeRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = before(ref("endDate"));
    const resolvedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({ value: resolvedDate } as ReturnType<typeof unpackRef>);

    const result = beforeRule({
      rule,
      value: testDate,
      path: "currentDate",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = before(beforeDate);
    const testValue = new Date("2025-01-01");

    vi.mocked(unpackRef).mockReturnValue({ value: beforeDate } as ReturnType<typeof unpackRef>);

    const result = beforeRule({
      rule,
      value: testValue,
      path: "$.deadline",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.deadline");
    expect(result?.message).toContain("after");
    expect(result?.code).toBe("before");
  });
});
