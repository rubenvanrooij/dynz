import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import { validateEnum } from "./validators";
import { enum as enumBuilder } from "./builder";
import { equals } from "../../rules";

// Mock the equals rule
vi.mock("../../rules", () => ({
  equalsRule: vi.fn(),
  equals: vi.fn(),
}));

import { equalsRule } from "../../rules";

describe("validateEnum", () => {
  const testEnum = {
    ADMIN: "admin",
    USER: "user",
  } as const;
  const mockSchema = enumBuilder({ enum: testEnum });
  const mockContext = {} as unknown as Context<typeof mockSchema>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delegate to equalsRule for equals validation", () => {
    const rule = equals("admin");
    const contextObj = {
      type: SchemaType.ENUM,
      ruleType: "equals" as const,
      rule,
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
