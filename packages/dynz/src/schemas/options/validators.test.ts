import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import { validateOptions } from "./validators";
import { options } from "./builder";
import { equals, custom } from "../../rules";

// Mock the rules
vi.mock("../../rules", () => ({
  equalsRule: vi.fn(),
  customRule: vi.fn(),
  equals: vi.fn(),
  custom: vi.fn(),
}));

import { equalsRule, customRule } from "../../rules";

describe("validateOptions", () => {
  const testOptions = ["small", "medium", "large"];
  const mockSchema = options({ options: testOptions });
  const mockContext = {} as unknown as Context<typeof mockSchema>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delegate to equalsRule for equals validation", () => {
    const rule = equals("medium");
    const contextObj = {
      type: SchemaType.OPTIONS,
      ruleType: "equals" as const,
      rule,
      schema: mockSchema,
      path: "$.size",
      value: "medium",
      context: mockContext,
    };

    vi.mocked(equalsRule).mockReturnValue(undefined);
    const result = validateOptions(contextObj);
    expect(equalsRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to customRule for custom validation", () => {
    const rule = custom("testRule");
    const contextObj = {
      type: SchemaType.OPTIONS,
      ruleType: "custom" as const,
      rule,
      schema: mockSchema,
      path: "$.size",
      value: "medium",
      context: mockContext,
    };

    vi.mocked(customRule).mockReturnValue(undefined);
    const result = validateOptions(contextObj);
    expect(customRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });
});
