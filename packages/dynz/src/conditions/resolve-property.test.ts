import { beforeEach, describe, expect, it, vi } from "vitest";
import { string } from "../schemas";
import type { ResolveContext } from "../types";
import { eq } from "./builder";
import { resolveProperty } from "./resolve-property";

// Mock dependencies
vi.mock("./resolve-condition", () => ({
  resolveCondition: vi.fn(),
}));

import { resolveCondition } from "./resolve-condition";

describe("resolveProperty", () => {
  const mockContext: ResolveContext = {
    schema: string(),
    values: {
      new: { user: { name: "John", age: 30 } },
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return default value when property is undefined", () => {
    const schema = string();

    const result = resolveProperty(schema, "required", "$.test", true, mockContext);

    expect(result).toBe(true);
  });

  it("should return boolean value when property is boolean", () => {
    const schema = string({ required: false });

    const result = resolveProperty(schema, "required", "$.test", true, mockContext);

    expect(result).toBe(false);
  });

  it("should resolve condition when property is condition", () => {
    const condition = eq("$.user.age", 18);
    const schema = string({ required: condition });

    vi.mocked(resolveCondition).mockReturnValue(true);

    const result = resolveProperty(schema, "required", "$.test", false, mockContext);

    expect(result).toBe(true);
    expect(resolveCondition).toHaveBeenCalledWith(condition, "$.test", mockContext);
  });
});
