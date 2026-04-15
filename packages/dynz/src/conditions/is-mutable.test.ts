import { beforeEach, describe, expect, it, vi } from "vitest";
import { object, string } from "../schemas";
import { isMutable } from "./is-mutable";

// Mock dependencies
vi.mock("./resolve-property", () => ({
  resolveProperty: vi.fn(),
}));

import { resolveProperty } from "./resolve-property";

describe("isMutable", () => {
  const mockSchema = object({
    name: string().setMutable(true),
    id: string().setMutable(false),
  });

  const mockValues = {
    user: {
      name: "John",
      id: "123",
      role: "admin",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return result from resolveProperty", () => {
    const path = "$.user.name";

    vi.mocked(resolveProperty).mockReturnValue(true);

    const result = isMutable(mockSchema, path, mockValues);

    expect(result).toBe(true);
    expect(resolveProperty).toHaveBeenCalledWith("mutable", path, true, {
      schema: mockSchema,
      values: mockValues,
    });
  });
});
