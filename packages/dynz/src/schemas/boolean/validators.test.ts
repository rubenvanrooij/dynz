import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import { validateBoolean } from "./validators";
import { boolean } from "./builder";
import { equals, custom } from "../../rules";

// Mock the rules
vi.mock("../../rules", () => ({
  equalsRule: vi.fn(),
  customRule: vi.fn(),
  equals: vi.fn(),
  custom: vi.fn(),
}));

import { equalsRule, customRule } from "../../rules";

describe("validateBoolean", () => {
  const mockSchema = boolean();
  const mockContext = {} as unknown as Context<typeof mockSchema>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delegate to equalsRule for equals validation", () => {
    const rule = equals(true);
    const contextObj = {
      type: SchemaType.BOOLEAN,
      ruleType: "equals" as const,
      rule,
      schema: mockSchema,
      path: "$.isActive",
      value: true,
      context: mockContext,
    };

    vi.mocked(equalsRule).mockReturnValue(undefined);
    const result = validateBoolean(contextObj);
    expect(equalsRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to customRule for custom validation", () => {
    const rule = custom("testRule");
    const contextObj = {
      type: SchemaType.BOOLEAN,
      ruleType: "custom" as const,
      rule,
      schema: mockSchema,
      path: "$.isActive",
      value: true,
      context: mockContext,
    };

    vi.mocked(customRule).mockReturnValue(undefined);
    const result = validateBoolean(contextObj);
    expect(customRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });
});
