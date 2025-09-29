import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import { validateDate } from "./validators";
import { date } from "./builder";
import { equals, before, after, minDate, maxDate, custom } from "../../rules";

// Mock the rules
vi.mock("../../rules", () => ({
  equalsDateRule: vi.fn(),
  beforeRule: vi.fn(),
  afterRule: vi.fn(),
  minDateRule: vi.fn(),
  maxDateRule: vi.fn(),
  customRule: vi.fn(),
  equals: vi.fn(),
  before: vi.fn(),
  after: vi.fn(),
  minDate: vi.fn(),
  maxDate: vi.fn(),
  custom: vi.fn(),
}));

import { equalsDateRule, beforeRule, afterRule, minDateRule, maxDateRule, customRule } from "../../rules";

describe("validateDate", () => {
  const mockSchema = date();
  const mockContext = {} as unknown as Context<typeof mockSchema>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delegate to equalsDateRule for equals validation", () => {
    const rule = equals(new Date("2024-01-01"));
    const contextObj = {
      type: SchemaType.DATE,
      ruleType: "equals" as const,
      rule,
      schema: mockSchema,
      path: "$.createdAt",
      value: new Date("2024-01-01"),
      context: mockContext,
    };

    vi.mocked(equalsDateRule).mockReturnValue(undefined);
    const result = validateDate(contextObj);
    expect(equalsDateRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to beforeRule for before validation", () => {
    const rule = before(new Date("2024-12-31"));
    const contextObj = {
      type: SchemaType.DATE,
      ruleType: "before" as const,
      rule,
      schema: mockSchema,
      path: "$.createdAt",
      value: new Date("2024-06-15"),
      context: mockContext,
    };

    vi.mocked(beforeRule).mockReturnValue(undefined);
    const result = validateDate(contextObj);
    expect(beforeRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to afterRule for after validation", () => {
    const rule = after(new Date("2024-01-01"));
    const contextObj = {
      type: SchemaType.DATE,
      ruleType: "after" as const,
      rule,
      schema: mockSchema,
      path: "$.createdAt",
      value: new Date("2024-06-15"),
      context: mockContext,
    };

    vi.mocked(afterRule).mockReturnValue(undefined);
    const result = validateDate(contextObj);
    expect(afterRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to minDateRule for min_date validation", () => {
    const rule = minDate(new Date("2024-01-01"));
    const contextObj = {
      type: SchemaType.DATE,
      ruleType: "min_date" as const,
      rule,
      schema: mockSchema,
      path: "$.createdAt",
      value: new Date("2024-06-15"),
      context: mockContext,
    };

    vi.mocked(minDateRule).mockReturnValue(undefined);
    const result = validateDate(contextObj);
    expect(minDateRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to maxDateRule for max_date validation", () => {
    const rule = maxDate(new Date("2024-12-31"));
    const contextObj = {
      type: SchemaType.DATE,
      ruleType: "max_date" as const,
      rule,
      schema: mockSchema,
      path: "$.createdAt",
      value: new Date("2024-06-15"),
      context: mockContext,
    };

    vi.mocked(maxDateRule).mockReturnValue(undefined);
    const result = validateDate(contextObj);
    expect(maxDateRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to customRule for custom validation", () => {
    const rule = custom("testRule");
    const contextObj = {
      type: SchemaType.DATE,
      ruleType: "custom" as const,
      rule,
      schema: mockSchema,
      path: "$.createdAt",
      value: new Date("2024-06-15"),
      context: mockContext,
    };

    vi.mocked(customRule).mockReturnValue(undefined);
    const result = validateDate(contextObj);
    expect(customRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });
});
