import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type DateSchema, date } from "../../schemas";
import type { Context } from "../../types";
import { buildMinDateRule, minDateRule } from "./index";

describe("minDate rule", () => {
  it("should create minDate rule with Date object", () => {
    const dateObj = new Date("2024-01-01");
    const rule = buildMinDateRule(v(dateObj));

    expect(rule).toEqual({
      type: "min_date",
      min: v(dateObj),
    });
  });

  it("should create minDate rule with reference", () => {
    const reference = ref("$.minDate");
    const rule = buildMinDateRule(reference);

    expect(rule).toEqual({
      type: "min_date",
      min: { type: REFERENCE_TYPE, path: "$.minDate" },
    });
  });

  it("should create minDate rule with custom code", () => {
    const dateObj = new Date("2024-01-01");
    const rule = buildMinDateRule(v(dateObj), "CUSTOM_MIN_DATE_ERROR");

    expect(rule).toEqual({
      type: "min_date",
      min: v(dateObj),
      code: "CUSTOM_MIN_DATE_ERROR",
    });
  });
});

describe("minDateRule validator", () => {
  const testDate = new Date("2024-06-15");
  const minDateValue = new Date("2024-01-01");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  it("should return undefined when value is after minimum date", () => {
    const rule = buildMinDateRule(v(minDateValue));

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
    const rule = buildMinDateRule(v(new Date("2024-12-31")));

    const result = await minDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_date");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("is before or on");
  });

  it("should return undefined when resolved min is undefined", () => {
    const rule = buildMinDateRule(undefined);

    const result = minDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = buildMinDateRule(v(new Date("2024-12-31")));
    const testValue = new Date("2024-01-01");

    const result = await minDateRule({
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

  it("should return undefined when value equals minimum date", () => {
    const rule = buildMinDateRule(v(testDate));

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
    const rule = buildMinDateRule(v(sameDay));

    const result = await minDateRule({
      rule,
      value: sameDayDifferentTime,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("min_date");
  });

  it("should return undefined when value is significantly after minimum", () => {
    const rule = buildMinDateRule(v(new Date("2024-01-01")));
    const futureDate = new Date("2025-12-31");

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
    const rule = buildMinDateRule(v(new Date("2024-06-15")));
    const pastDate = new Date("2020-01-01");

    const result = await minDateRule({
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
