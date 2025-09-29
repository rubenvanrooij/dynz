import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import { validateObject } from "./validators";
import { object } from "./builder";
import { minEntries, maxEntries, custom } from "../../rules";

// Mock the rules
vi.mock("../../rules", () => ({
  minEntriesRule: vi.fn(),
  maxEntriesRule: vi.fn(),
  customRule: vi.fn(),
  minEntries: vi.fn(),
  maxEntries: vi.fn(),
  custom: vi.fn(),
}));

import { minEntriesRule, maxEntriesRule, customRule } from "../../rules";

describe("validateObject", () => {
  const mockSchema = object({ fields: {} });
  const mockContext = {} as unknown as Context<typeof mockSchema>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delegate to minEntriesRule for min_entries validation", () => {
    const rule = minEntries(1);
    const contextObj = {
      type: SchemaType.OBJECT,
      ruleType: "min_entries" as const,
      rule,
      schema: mockSchema,
      path: "$.user",
      value: { name: "John" },
      context: mockContext,
    };

    vi.mocked(minEntriesRule).mockReturnValue(undefined);
    const result = validateObject(contextObj);
    expect(minEntriesRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to maxEntriesRule for max_entries validation", () => {
    const rule = maxEntries(10);
    const contextObj = {
      type: SchemaType.OBJECT,
      ruleType: "max_entries" as const,
      rule,
      schema: mockSchema,
      path: "$.user",
      value: { name: "John" },
      context: mockContext,
    };

    vi.mocked(maxEntriesRule).mockReturnValue(undefined);
    const result = validateObject(contextObj);
    expect(maxEntriesRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to customRule for custom validation", () => {
    const rule = custom("testRule");
    const contextObj = {
      type: SchemaType.OBJECT,
      ruleType: "custom" as const,
      rule,
      schema: mockSchema,
      path: "$.user",
      value: { name: "John" },
      context: mockContext,
    };

    vi.mocked(customRule).mockReturnValue(undefined);
    const result = validateObject(contextObj);
    expect(customRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });
});
