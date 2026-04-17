import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type DateSchema, date } from "../../schemas";
import type { Context } from "../../types";
import { buildMaxDateRule, maxDateRule } from "./index";

describe("maxDate rule", () => {
  it("should create maxDate rule with Date object", () => {
    const dateObj = new Date("2024-12-31");
    const rule = buildMaxDateRule(v(dateObj));

    expect(rule).toEqual({
      type: "max_date",
      max: v(dateObj),
    });
  });

  it("should create maxDate rule with reference", () => {
    const reference = ref("$.maxDate");
    const rule = buildMaxDateRule(reference);

    expect(rule).toEqual({
      type: "max_date",
      max: { type: REFERENCE_TYPE, path: "$.maxDate" },
    });
  });

  it("should create maxDate rule with custom code", () => {
    const dateObj = new Date("2024-06-15");
    const rule = buildMaxDateRule(v(dateObj), "CUSTOM_MAX_DATE_ERROR");

    expect(rule).toEqual({
      type: "max_date",
      max: v(dateObj),
      code: "CUSTOM_MAX_DATE_ERROR",
    });
  });
});

describe("maxDateRule validator", () => {
  const testDate = new Date("2024-06-15");
  const maxDateValue = new Date("2024-12-31");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  it("should return undefined when value is before maximum date", () => {
    const rule = buildMaxDateRule(v(maxDateValue));

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
    const rule = buildMaxDateRule(v(new Date("2024-01-01")));

    const result = await maxDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("max_date");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("is after or on");
  });

  it("should return undefined when resolved max is undefined", () => {
    const rule = buildMaxDateRule(undefined);

    const result = maxDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = buildMaxDateRule(v(new Date("2024-01-01")));
    const testValue = new Date("2024-12-31");

    const result = await maxDateRule({
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

  it("should return undefined when value equals maximum date", () => {
    const rule = buildMaxDateRule(v(testDate));

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
    const rule = buildMaxDateRule(v(sameDay));

    const result = await maxDateRule({
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
    const rule = buildMaxDateRule(v(date1));

    const result = await maxDateRule({
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
