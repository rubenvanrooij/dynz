import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, type DateStringSchema, date, dateString } from "../../schemas";
import type { Context } from "../../types";
import { getDateFromDateOrDateStringRefeference } from "../utils/reference";
import { after, afterDateStringRule, afterRule } from "./index";

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

vi.mock("../utils/reference", () => ({
  getDateFromDateOrDateStringRefeference: vi.fn(),
}));

describe("after rule", () => {
  it("should create after rule with Date object", () => {
    const dateObj = new Date("2024-01-01");
    const rule = after(dateObj);

    expect(rule).toEqual({
      type: "after",
      after: dateObj,
    });
  });

  it("should create after rule with date string", () => {
    const rule = after("2024-01-01");

    expect(rule).toEqual({
      type: "after",
      after: "2024-01-01",
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

    vi.mocked(unpackRef).mockReturnValue({
      value: afterDate,
      static: true,
    } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({
      value: new Date("2024-01-02"),
      static: true,
    } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({
      value: undefined,
      static: true,
    } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({
      value: resolvedDate,
      static: true,
    } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({
      value: afterDate,
      static: true,
    } as ReturnType<typeof unpackRef>);

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

describe("afterRule cross-type validation", () => {
  const testDate = new Date("2024-06-15");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate Date field against DateString reference", () => {
    const rule = after(ref("dateStringField"));
    const referencedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-01-01",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = afterRule({
      rule,
      schema: mockSchema,
      value: testDate,
      path: "dateField",
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.after, "dateField", mockContext, "date", "date_string");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: "2024-01-01",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    expect(result).toBeUndefined(); // testDate (2024-06-15) is after referencedDate (2024-01-01)
  });

  it("should return error when Date field is before DateString reference", () => {
    const rule = after(ref("dateStringField"));
    const referencedDate = new Date("2024-12-31");
    const earlyTestDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-12-31",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = afterRule({
      rule,
      schema: mockSchema,
      value: earlyTestDate,
      path: "dateField",
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("after");
    expect(result?.after).toBe(referencedDate); // Should use processed reference value
    expect(result?.message).toContain("dateField");
    expect(result?.message).toContain("before");
  });
});

describe("afterDateStringRule cross-type validation", () => {
  const mockContext = {} as unknown as Context<DateStringSchema>;
  const mockSchema = dateString({ format: "yyyy-MM-dd" });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate DateString field against Date reference", () => {
    const rule = after(ref("dateField"));
    const referencedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = afterDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.after, "dateStringField", mockContext, "date", "date_string");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    expect(result).toBeUndefined(); // "2024-06-15" is after 2024-01-01
  });

  it("should validate DateString field against DateString reference", () => {
    const rule = after(ref("otherDateStringField"));
    const referencedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-01-01",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = afterDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // "2024-06-15" is after "2024-01-01"
  });

  it("should return error when DateString field is before Date reference", () => {
    const rule = after(ref("dateField"));
    const referencedDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = afterDateStringRule({
      rule,
      value: "2024-01-01",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("after");
    expect(result?.after).toBe(referencedDate); // Should use original reference value
    expect(result?.message).toContain("dateStringField");
    expect(result?.message).toContain("before");
  });

  it("should handle undefined reference values", () => {
    const rule = after(ref("nonExistentField"));

    vi.mocked(unpackRef).mockReturnValue({
      value: undefined,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(undefined);

    const result = afterDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Should return undefined when reference is undefined
  });
});
