import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, type DateStringSchema, date, dateString } from "../../schemas";
import type { Context } from "../../types";
import { getDateFromDateOrDateStringRefeference } from "../utils/reference";
import { maxDate, maxDateRule, maxDateStringRule } from "./index";

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

vi.mock("../utils/reference", () => ({
  getDateFromDateOrDateStringRefeference: vi.fn(),
}));

describe("maxDate rule", () => {
  it("should create maxDate rule with Date object", () => {
    const dateObj = new Date("2024-12-31");
    const rule = maxDate(dateObj);

    expect(rule).toEqual({
      type: "max_date",
      max: dateObj,
    });
  });

  it("should create maxDate rule with date string", () => {
    const rule = maxDate("2024-12-31");

    expect(rule).toEqual({
      type: "max_date",
      max: "2024-12-31",
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

    vi.mocked(unpackRef).mockReturnValue({ value: maxDateValue, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-01-01"), static: true } as ReturnType<
      typeof unpackRef
    >);

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

    vi.mocked(unpackRef).mockReturnValue({ value: undefined, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: resolvedDate, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-01-01"), static: true } as ReturnType<
      typeof unpackRef
    >);

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

    vi.mocked(unpackRef).mockReturnValue({ value: testDate, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: sameDay, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: date1, static: true } as ReturnType<typeof unpackRef>);

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

describe("maxDateRule cross-type validation", () => {
  const testDate = new Date("2024-06-15");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate Date field against DateString reference", () => {
    const rule = maxDate(ref("dateStringField"));
    const referencedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-12-31",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = maxDateRule({
      rule,
      schema: mockSchema,
      value: testDate,
      path: "dateField",
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.max, "dateField", mockContext, "date", "date_string");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: "2024-12-31",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    expect(result).toBeUndefined(); // testDate (2024-06-15) is before referencedDate (2024-12-31)
  });

  it("should return error when Date field is after DateString reference", () => {
    const rule = maxDate(ref("dateStringField"));
    const referencedDate = new Date("2024-01-01");
    const lateTestDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-01-01",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = maxDateRule({
      rule,
      schema: mockSchema,
      value: lateTestDate,
      path: "dateField",
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_date");
    expect(result?.max).toBe(referencedDate); // Should use processed reference value
    expect(result?.message).toContain("dateField");
    expect(result?.message).toContain("after");
  });

  it("should handle equal dates correctly", () => {
    const rule = maxDate(ref("dateStringField"));
    const sameDate = new Date("2024-06-15");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-06-15",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(sameDate);

    const result = maxDateRule({
      rule,
      schema: mockSchema,
      value: sameDate,
      path: "dateField",
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Equal dates should pass
  });
});

describe("maxDateStringRule cross-type validation", () => {
  const mockContext = {} as unknown as Context<DateStringSchema>;
  const mockSchema = dateString({ format: "yyyy-MM-dd" });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate DateString field against Date reference", () => {
    const rule = maxDate(ref("dateField"));
    const referencedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = maxDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.max, "dateStringField", mockContext, "date", "date_string");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    expect(result).toBeUndefined(); // "2024-06-15" is before 2024-12-31
  });

  it("should validate DateString field against DateString reference", () => {
    const rule = maxDate(ref("otherDateStringField"));
    const referencedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-12-31",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = maxDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // "2024-06-15" is before "2024-12-31"
  });

  it("should return error when DateString field is after Date reference", () => {
    const rule = maxDate(ref("dateField"));
    const referencedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = maxDateStringRule({
      rule,
      value: "2024-12-31",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_date");
    expect(result?.max).toBe(referencedDate); // Should use original reference value
    expect(result?.message).toContain("dateStringField");
    expect(result?.message).toContain("after");
  });

  it("should handle undefined reference values", () => {
    const rule = maxDate(ref("nonExistentField"));

    vi.mocked(unpackRef).mockReturnValue({
      value: undefined,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(undefined);

    const result = maxDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Should return undefined when reference is undefined
  });

  it("should handle equal dates correctly for DateString", () => {
    const rule = maxDate(ref("dateField"));
    const sameDate = new Date("2024-06-15");

    vi.mocked(unpackRef).mockReturnValue({
      value: sameDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(sameDate);

    const result = maxDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Equal dates should pass
  });
});
