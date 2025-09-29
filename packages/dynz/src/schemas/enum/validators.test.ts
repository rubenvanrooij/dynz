import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import type { EnumSchema } from "./types";
import { validateEnum } from "./validators";

// Mock the equals rule
vi.mock("../../rules", () => ({
  equalsRule: vi.fn(),
}));

import { equalsRule } from "../../rules";

describe("validateEnum", () => {
  const testEnum = {
    ADMIN: "admin",
    USER: "user",
  } as const;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delegate to equalsRule for equals validation", () => {
    const mockContext = {} as unknown as Context<EnumSchema<typeof testEnum>>;
    const mockSchema: EnumSchema<typeof testEnum> = {
      type: SchemaType.ENUM,
      enum: testEnum,
    };

    const contextObj = {
      type: SchemaType.ENUM,
      ruleType: "equals" as const,
      rule: { type: "equals" as const, equals: "admin" },
      schema: mockSchema,
      path: "$.role",
      value: "admin",
      context: mockContext,
    };

    vi.mocked(equalsRule).mockReturnValue(undefined);

    const result = validateEnum(contextObj);

    expect(equalsRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });
});
