import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, date } from "../../schemas";
import type { Context } from "../../types";
import { maxDate, maxDateRule } from "./index";

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

describe("maxDate rule", () => {
  it("should create maxDate rule with Date object", () => {
    const dateObj = new Date("2024-12-31");
    const rule = maxDate(dateObj);

    expect(rule).toEqual({
      type: "max_date",
      max: dateObj,
    });
  });

  it("should create maxDate rule with reference", () => {
    const reference = ref("$.maxDate");
    const rule = maxDate(reference);

    expect(rule).toEqual({
      type: "max_date",
      max: {
        _type: REFERENCE_TYPE,
        path: "$.maxDate",
      },
    });
  });

  it("should create maxDate rule with custom code", () => {
    const rule = maxDate(new Date("2024-06-15"), "CUSTOM_MAX_DATE_ERROR");

    expect(rule).toEqual({
      type: "max_date",
      max: new Date("2024-06-15"),
      code: "CUSTOM_MAX_DATE_ERROR",
    });
  });
});

describe("maxDateRule validator", () => {
  const testDate = new Date("2024-06-15");
  const maxDateValue = new Date("2024-12-31");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value is before maximum date", async () => {
    const rule = maxDate(maxDateValue);

    vi.mocked(unpackRef).mockReturnValue({ value: maxDateValue } as ReturnType<typeof unpackRef>);

    const result = maxDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value is after maximum date", async () => {
    const rule = maxDate(new Date("2024-01-01"));

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-01-01") } as ReturnType<typeof unpackRef>);

    const result = maxDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("max_date");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("is after or on");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = maxDate(maxDateValue);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = maxDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = maxDate(ref("endDate"));
    const resolvedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({ value: resolvedDate } as ReturnType<typeof unpackRef>);

    const result = maxDateRule({
      rule,
      value: testDate,
      path: "currentDate",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = maxDate(new Date("2024-01-01"));
    const testValue = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-01-01") } as ReturnType<typeof unpackRef>);

    const result = maxDateRule({
      rule,
      value: testValue,
      path: "$.deadline",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.deadline");
    expect(result?.message).toContain("is after or on");
    expect(result?.code).toBe("max_date");
  });

  it("should return undefined when value equals maximum date", async () => {
    const rule = maxDate(testDate);

    vi.mocked(unpackRef).mockReturnValue({ value: testDate } as ReturnType<typeof unpackRef>);

    const result = maxDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle same date with different time correctly", async () => {
    const sameDay = new Date("2024-06-15T10:00:00");
    const sameDayDifferentTime = new Date("2024-06-15T15:30:00");
    const rule = maxDate(sameDay);

    vi.mocked(unpackRef).mockReturnValue({ value: sameDay } as ReturnType<typeof unpackRef>);

    const result = maxDateRule({
      rule,
      value: sameDayDifferentTime,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_date");
  });

  it("should handle edge case with very close dates", async () => {
    const date1 = new Date("2024-06-15T23:59:59.999");
    const date2 = new Date("2024-06-16T00:00:00.000");
    const rule = maxDate(date1);

    vi.mocked(unpackRef).mockReturnValue({ value: date1 } as ReturnType<typeof unpackRef>);

    const result = maxDateRule({
      rule,
      value: date2,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_date");
  });
});
