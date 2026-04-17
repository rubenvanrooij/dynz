import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type DateSchema, date } from "../../schemas";
import type { Context } from "../../types";
import { afterRule, buildAfterRule } from "./index";

describe("after rule", () => {
  it("should create after rule with Date object", () => {
    const dateObj = new Date("2024-01-01");
    const rule = buildAfterRule(v(dateObj));

    expect(rule).toEqual({
      type: "after",
      after: v(dateObj),
    });
  });

  it("should create after rule with reference", () => {
    const reference = ref("$.startDate");
    const rule = buildAfterRule(reference);

    expect(rule).toEqual({
      type: "after",
      after: { type: REFERENCE_TYPE, path: "$.startDate" },
    });
  });

  it("should create after rule with custom code", () => {
    const dateObj = new Date("2024-06-15");
    const rule = buildAfterRule(v(dateObj), "CUSTOM_AFTER_ERROR");

    expect(rule).toEqual({
      type: "after",
      after: v(dateObj),
      code: "CUSTOM_AFTER_ERROR",
    });
  });
});

describe("afterRule validator", () => {
  const testDate = new Date("2024-01-01");
  const afterDate = new Date("2023-12-01");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  it("should return undefined when value is after reference date", () => {
    const rule = buildAfterRule(v(afterDate));

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
    const futureDate = new Date("2025-01-01");
    const rule = buildAfterRule(v(futureDate));

    const result = await afterRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("after");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("before");
  });

  it("should return undefined when resolved after is undefined", () => {
    const rule = buildAfterRule(undefined);

    const result = afterRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = buildAfterRule(v(new Date("2025-06-01")));
    const testValue = new Date("2023-11-01");

    const result = await afterRule({
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
