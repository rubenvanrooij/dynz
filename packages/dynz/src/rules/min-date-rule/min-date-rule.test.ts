import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, date } from "../../schemas";
import type { Context } from "../../types";
import { minDate, minDateRule } from "./index";

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

describe("minDate rule", () => {
  it("should create minDate rule with Date object", () => {
    const dateObj = new Date("2024-01-01");
    const rule = minDate(dateObj);

    expect(rule).toEqual({
      type: "min_date",
      min: dateObj,
    });
  });

  it("should create minDate rule with reference", () => {
    const reference = ref("$.minDate");
    const rule = minDate(reference);

    expect(rule).toEqual({
      type: "min_date",
      min: {
        _type: REFERENCE_TYPE,
        path: "$.minDate",
      },
    });
  });

  it("should create minDate rule with custom code", () => {
    const rule = minDate(new Date("2024-01-01"), "CUSTOM_MIN_DATE_ERROR");

    expect(rule).toEqual({
      type: "min_date",
      min: new Date("2024-01-01"),
      code: "CUSTOM_MIN_DATE_ERROR",
    });
  });
});

describe("minDateRule validator", () => {
  const testDate = new Date("2024-06-15");
  const minDateValue = new Date("2024-01-01");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value is after minimum date", async () => {
    const rule = minDate(minDateValue);

    vi.mocked(unpackRef).mockReturnValue({ value: minDateValue } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value is before minimum date", async () => {
    const rule = minDate(new Date("2024-12-31"));

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-12-31") } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("min_date");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("is before or on");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = minDate(minDateValue);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = minDate(ref("startDate"));
    const resolvedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({ value: resolvedDate } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: testDate,
      path: "currentDate",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = minDate(new Date("2024-12-31"));
    const testValue = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-12-31") } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: testValue,
      path: "$.deadline",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.deadline");
    expect(result?.message).toContain("is before or on");
    expect(result?.code).toBe("min_date");
  });

  it("should return undefined when value equals minimum date", async () => {
    const rule = minDate(testDate);

    vi.mocked(unpackRef).mockReturnValue({ value: testDate } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle same date with different time correctly", async () => {
    const sameDay = new Date("2024-06-15T15:30:00");
    const sameDayDifferentTime = new Date("2024-06-15T10:00:00");
    const rule = minDate(sameDay);

    vi.mocked(unpackRef).mockReturnValue({ value: sameDay } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: sameDayDifferentTime,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_date");
  });

  it("should handle edge case with very close dates", async () => {
    const date1 = new Date("2024-06-16T00:00:00.000");
    const date2 = new Date("2024-06-15T23:59:59.999");
    const rule = minDate(date1);

    vi.mocked(unpackRef).mockReturnValue({ value: date1 } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: date2,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_date");
  });

  it("should return undefined when value is significantly after minimum", async () => {
    const rule = minDate(new Date("2024-01-01"));
    const futureDate = new Date("2025-12-31");

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-01-01") } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: futureDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle past date validation correctly", async () => {
    const rule = minDate(new Date("2024-06-15"));
    const pastDate = new Date("2020-01-01");

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-06-15") } as ReturnType<typeof unpackRef>);

    const result = minDateRule({
      rule,
      value: pastDate,
      path: "birthDate",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_date");
    expect(result?.message).toContain("birthDate");
  });
});
