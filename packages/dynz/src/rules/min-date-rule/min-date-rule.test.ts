import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, type DateStringSchema, date, dateString } from "../../schemas";
import type { Context } from "../../types";
import { parseDateString } from "../../validate/validate-type";
import { getDateFromDateOrDateStringRefeference } from "../utils/reference";
import { minDate, minDateRule, minDateStringRule } from "./index";

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

describe("minDate rule", () => {
  it("should create minDate rule with Date object", () => {
    const dateObj = new Date("2024-01-01");
    const rule = minDate(dateObj);

    expect(rule).toEqual({
      type: "min_date",
      min: dateObj,
    });
  });

  it("should create minDate rule with date string", () => {
    const rule = minDate("2024-01-01");

    expect(rule).toEqual({
      type: "min_date",
      min: "2024-01-01",
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

    vi.mocked(unpackRef).mockReturnValue({ value: minDateValue, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-12-31"), static: true } as ReturnType<
      typeof unpackRef
    >);

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

    vi.mocked(unpackRef).mockReturnValue({ value: undefined, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: resolvedDate, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-12-31"), static: true } as ReturnType<
      typeof unpackRef
    >);

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

    vi.mocked(unpackRef).mockReturnValue({ value: testDate, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: sameDay, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: date1, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-01-01"), static: true } as ReturnType<
      typeof unpackRef
    >);

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

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2024-06-15"), static: true } as ReturnType<
      typeof unpackRef
    >);

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

describe("minDateRule cross-type validation", () => {
  const testDate = new Date("2024-06-15");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate Date field against DateString reference", () => {
    const rule = minDate(ref("dateStringField"));
    const referencedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-01-01",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = minDateRule({
      rule,
      schema: mockSchema,
      value: testDate,
      path: "dateField",
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.min, "dateField", mockContext, "date_string", "date");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: "2024-01-01",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    expect(result).toBeUndefined(); // testDate (2024-06-15) is after referencedDate (2024-01-01)
  });

  it("should return error when Date field is before DateString reference", () => {
    const rule = minDate(ref("dateStringField"));
    const referencedDate = parseDateString("2024-12-31");
    const earlyTestDate = parseDateString("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-12-31",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = minDateRule({
      rule,
      schema: mockSchema,
      value: earlyTestDate,
      path: "dateField",
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_date");
    expect(result?.min).toBe(referencedDate);
    expect(result?.message).toContain("dateField");
    expect(result?.message).toContain("before or on");
  });

  it("should handle equal dates correctly", () => {
    const rule = minDate(ref("dateStringField"));
    const sameDate = new Date("2024-06-15");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-06-15",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(sameDate);

    const result = minDateRule({
      rule,
      schema: mockSchema,
      value: sameDate,
      path: "dateField",
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Equal dates should pass
  });
});

describe("minDateStringRule cross-type validation", () => {
  const mockContext = {} as unknown as Context<DateStringSchema>;
  const mockSchema = dateString({ format: "yyyy-MM-dd" });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate DateString field against Date reference", () => {
    const rule = minDate(ref("dateField"));
    const referencedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = minDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.min, "dateStringField", mockContext, "date_string", "date");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    expect(result).toBeUndefined(); // "2024-06-15" is after 2024-01-01
  });

  it("should validate DateString field against DateString reference", () => {
    const rule = minDate(ref("otherDateStringField"));
    const referencedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-01-01",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = minDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // "2024-06-15" is after "2024-01-01"
  });

  it("should return error when DateString field is before Date reference", () => {
    const rule = minDate(ref("dateField"));
    const referencedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = minDateStringRule({
      rule,
      value: "2024-01-01",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_date");
    expect(result?.min).toBe(referencedDate); // Should use original reference value
    expect(result?.message).toContain("dateStringField");
    expect(result?.message).toContain("before or on");
  });

  it("should handle undefined reference values", () => {
    const rule = minDate(ref("nonExistentField"));

    vi.mocked(unpackRef).mockReturnValue({
      value: undefined,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(undefined);

    const result = minDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Should return undefined when reference is undefined
  });

  it("should handle equal dates correctly for DateString", () => {
    const rule = minDate(ref("dateField"));
    const sameDate = parseDateString("2024-06-15");

    vi.mocked(unpackRef).mockReturnValue({
      value: sameDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(sameDate);

    const result = minDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Equal dates should pass
  });
});
