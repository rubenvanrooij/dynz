import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type DateSchema, date } from "../../schemas";
import type { Context } from "../../types";
import { before, beforeRule } from "./index";

describe("before rule", () => {
  it("should create before rule with Date object", () => {
    const dateObj = new Date("2024-12-31");
    const rule = before(v(dateObj));

    expect(rule).toEqual({
      type: "before",
      before: v(dateObj),
    });
  });

  it("should create before rule with reference", () => {
    const reference = ref("$.endDate");
    const rule = before(reference);

    expect(rule).toEqual({
      type: "before",
      before: { type: REFERENCE_TYPE, path: "$.endDate" },
    });
  });

  it("should create before rule with custom code", () => {
    const dateObj = new Date("2024-01-01");
    const rule = before(v(dateObj), "CUSTOM_BEFORE_ERROR");

    expect(rule).toEqual({
      type: "before",
      before: v(dateObj),
      code: "CUSTOM_BEFORE_ERROR",
    });
  });
});

describe("beforeRule validator", () => {
  const testDate = new Date("2024-01-01");
  const beforeDate = new Date("2024-12-31");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  it("should return undefined when value is before reference date", () => {
    const rule = before(v(beforeDate));

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
    const pastDate = new Date("2023-12-30");
    const rule = before(v(pastDate));

    const result = await beforeRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("before");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("after");
  });

  it("should return undefined when resolved before is undefined", () => {
    const rule = before(undefined);

    const result = beforeRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = before(v(new Date("2023-06-01")));
    const testValue = new Date("2025-01-01");

    const result = await beforeRule({
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
