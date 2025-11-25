import { describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import { string } from "../string";
import { array } from "./builder";
import { validateArray } from "./validators";

// Mock the rules
vi.mock("../../rules", () => ({
  minLengthRule: vi.fn(),
  maxLengthRule: vi.fn(),
  customRule: vi.fn(),
  minLength: vi.fn(),
  maxLength: vi.fn(),
  custom: vi.fn(),
}));

import { custom, customRule, maxLength, maxLengthRule, minLength, minLengthRule } from "../../rules";

describe("validateArray", () => {
  const mockSchema = array({ schema: string() });
  const mockContext = {} as unknown as Context<typeof mockSchema>;

  it("should delegate to minLengthRule for min_length validation", () => {
    const rule = minLength(1);
    const contextObj = {
      type: SchemaType.ARRAY,
      ruleType: "min_length" as const,
      rule,
      schema: mockSchema,
      path: "$.items",
      value: ["a", "b"],
      context: mockContext,
    };

    vi.mocked(minLengthRule).mockReturnValue(undefined);
    const result = validateArray(contextObj);
    expect(minLengthRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to maxLengthRule for max_length validation", () => {
    const rule = maxLength(10);
    const contextObj = {
      type: SchemaType.ARRAY,
      ruleType: "max_length" as const,
      rule,
      schema: mockSchema,
      path: "$.items",
      value: ["a", "b"],
      context: mockContext,
    };

    vi.mocked(maxLengthRule).mockReturnValue(undefined);
    const result = validateArray(contextObj);
    expect(maxLengthRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to customRule for custom validation", () => {
    const rule = custom("testRule");
    const contextObj = {
      type: SchemaType.ARRAY,
      ruleType: "custom" as const,
      rule,
      schema: mockSchema,
      path: "$.items",
      value: ["a", "b"],
      context: mockContext,
    };

    vi.mocked(customRule).mockReturnValue(undefined);
    const result = validateArray(contextObj);
    expect(customRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });
});
