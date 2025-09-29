import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import { validateNumber } from "./validators";
import { number } from "./builder";
import { min, max, equals, maxPrecision, oneOf, custom } from "../../rules";

// Mock the rules
vi.mock("../../rules", () => ({
  minRule: vi.fn(),
  maxRule: vi.fn(),
  equalsRule: vi.fn(),
  maxPrecisionRule: vi.fn(),
  oneOfRule: vi.fn(),
  customRule: vi.fn(),
  min: vi.fn(),
  max: vi.fn(),
  equals: vi.fn(),
  maxPrecision: vi.fn(),
  oneOf: vi.fn(),
  custom: vi.fn(),
}));

import { minRule, maxRule, equalsRule, maxPrecisionRule, oneOfRule, customRule } from "../../rules";

describe("validateNumber", () => {
  const mockSchema = number();
  const mockContext = {} as unknown as Context<typeof mockSchema>;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(min).mockImplementation((min) => ({ type: "min", min }));
    vi.mocked(max).mockImplementation((max) => ({ type: "max", max }));
    vi.mocked(equals).mockImplementation((equals) => ({ type: "equals", equals }));
    vi.mocked(maxPrecision).mockImplementation((maxPrecision) => ({ type: "max_precision", maxPrecision }));
    vi.mocked(oneOf).mockImplementation((values) => ({ type: "one_of", values }));
    vi.mocked(custom).mockImplementation((name) => ({ type: "custom", name, params: {} }));
  });

  it("should delegate to minRule for min validation", () => {
    const rule = min(0);
    const contextObj = {
      type: SchemaType.NUMBER,
      ruleType: "min" as const,
      rule,
      schema: mockSchema,
      path: "$.age",
      value: 25,
      context: mockContext,
    };

    vi.mocked(minRule).mockReturnValue(undefined);
    const result = validateNumber(contextObj);
    expect(minRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to maxRule for max validation", () => {
    const rule = max(100);
    const contextObj = {
      type: SchemaType.NUMBER,
      ruleType: "max" as const,
      rule,
      schema: mockSchema,
      path: "$.age",
      value: 25,
      context: mockContext,
    };

    vi.mocked(maxRule).mockReturnValue(undefined);
    const result = validateNumber(contextObj);
    expect(maxRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to equalsRule for equals validation", () => {
    const rule = equals(42);
    const contextObj = {
      type: SchemaType.NUMBER,
      ruleType: "equals" as const,
      rule,
      schema: mockSchema,
      path: "$.value",
      value: 42,
      context: mockContext,
    };

    vi.mocked(equalsRule).mockReturnValue(undefined);
    const result = validateNumber(contextObj);
    expect(equalsRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to maxPrecisionRule for max_precision validation", () => {
    const rule = maxPrecision(2);
    const contextObj = {
      type: SchemaType.NUMBER,
      ruleType: "max_precision" as const,
      rule,
      schema: mockSchema,
      path: "$.price",
      value: 19.99,
      context: mockContext,
    };

    vi.mocked(maxPrecisionRule).mockReturnValue(undefined);
    const result = validateNumber(contextObj);
    expect(maxPrecisionRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to oneOfRule for one_of validation", () => {
    const rule = oneOf([1, 2, 3]);
    const contextObj = {
      type: SchemaType.NUMBER,
      ruleType: "one_of" as const,
      rule,
      schema: mockSchema,
      path: "$.rating",
      value: 2,
      context: mockContext,
    };

    vi.mocked(oneOfRule).mockReturnValue(undefined);
    const result = validateNumber(contextObj);
    expect(oneOfRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to customRule for custom validation", () => {
    const rule = custom("testRule");
    const contextObj = {
      type: SchemaType.NUMBER,
      ruleType: "custom" as const,
      rule,
      schema: mockSchema,
      path: "$.value",
      value: 25,
      context: mockContext,
    };

    vi.mocked(customRule).mockReturnValue(undefined);
    const result = validateNumber(contextObj);
    expect(customRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });
});
