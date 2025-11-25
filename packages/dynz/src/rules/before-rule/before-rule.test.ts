import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, type DateStringSchema, date, dateString } from "../../schemas";
import type { Context } from "../../types";
import { before, beforeDateStringRule, beforeRule } from "./index";

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

describe("before rule", () => {
  it("should create before rule with Date object", () => {
    const dateObj = new Date("2024-12-31");
    const rule = before(dateObj);

    expect(rule).toEqual({
      type: "before",
      before: dateObj,
    });
  });

  it("should create before rule with date string", () => {
    const rule = before("2024-12-31");

    expect(rule).toEqual({
      type: "before",
      before: "2024-12-31",
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

    vi.mocked(unpackRef).mockReturnValue({ value: beforeDate, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: new Date("2023-12-30"), static: true } as ReturnType<
      typeof unpackRef
    >);

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

    vi.mocked(unpackRef).mockReturnValue({ value: undefined, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: resolvedDate, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: beforeDate, static: true } as ReturnType<typeof unpackRef>);

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

// Import the mock function after the mock is defined
import { getDateFromDateOrDateStringRefeference } from "../utils/reference";

describe("beforeRule cross-type validation", () => {
  const testDate = new Date("2024-06-15");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate Date field against DateString reference", () => {
    const rule = before(ref("dateStringField"));
    const referencedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-12-31",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = beforeRule({
      rule,
      schema: mockSchema,
      value: testDate,
      path: "dateField",
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.before, "dateField", mockContext, "date", "date_string");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: "2024-12-31",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    expect(result).toBeUndefined(); // testDate (2024-06-15) is before referencedDate (2024-12-31)
  });

  it("should return error when Date field is after DateString reference", () => {
    const rule = before(ref("dateStringField"));
    const referencedDate = new Date("2024-01-01");
    const lateTestDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-01-01",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = beforeRule({
      rule,
      schema: mockSchema,
      value: lateTestDate,
      path: "dateField",
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("before");
    expect(result?.before).toBe(referencedDate); // Should use processed reference value
    expect(result?.message).toContain("dateField");
    expect(result?.message).toContain("after");
  });
});

describe("beforeDateStringRule cross-type validation", () => {
  const mockContext = {} as unknown as Context<DateStringSchema>;
  const mockSchema = dateString({ format: "yyyy-MM-dd" });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate DateString field against Date reference", () => {
    const rule = before(ref("dateField"));
    const referencedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = beforeDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.before, "dateStringField", mockContext, "date", "date_string");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    expect(result).toBeUndefined(); // "2024-06-15" is before 2024-12-31
  });

  it("should validate DateString field against DateString reference", () => {
    const rule = before(ref("otherDateStringField"));
    const referencedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-12-31",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = beforeDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // "2024-06-15" is before "2024-12-31"
  });

  it("should return error when DateString field is after Date reference", () => {
    const rule = before(ref("dateField"));
    const referencedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = beforeDateStringRule({
      rule,
      value: "2024-12-31",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("before");
    expect(result?.before).toBe(referencedDate); // Should use original reference value
    expect(result?.message).toContain("dateStringField");
    expect(result?.message).toContain("after");
  });

  it("should handle undefined reference values", () => {
    const rule = before(ref("nonExistentField"));

    vi.mocked(unpackRef).mockReturnValue({
      value: undefined,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(undefined);

    const result = beforeDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Should return undefined when reference is undefined
  });
});
