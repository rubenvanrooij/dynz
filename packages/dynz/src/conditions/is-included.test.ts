import { beforeEach, describe, expect, it, vi } from "vitest";
import { object, string } from "../schemas";
import { isIncluded } from "./is-included";

// Mock dependencies
vi.mock("./resolve-property", () => ({
  resolveProperty: vi.fn(),
}));

import { resolveProperty } from "./resolve-property";

describe("isIncluded", () => {
  const mockSchema = object({
    fields: {
      name: string({ included: true }),
      email: string({ included: false }),
    },
  });

  const mockValues = {
    user: {
      name: "John",
      email: "john@example.com",
      role: "admin",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return true when all ancestors and leaf are included", () => {
    const path = "$.user.name";

    vi.mocked(resolveProperty).mockReturnValue(true);

    const result = isIncluded(mockSchema, path, mockValues);

    expect(result).toBe(true);
    expect(resolveProperty).toHaveBeenCalledWith("included", path, true, {
      schema: mockSchema,
      values: mockValues,
    });
  });

  it("should return false when the leaf schema is not included", () => {
    const path = "$.user.name";

    vi.mocked(resolveProperty).mockReturnValueOnce(false);

    const result = isIncluded(mockSchema, path, mockValues);

    expect(result).toBe(false);
  });

  it("should check only the leaf for a top-level path", () => {
    const path = "$.name";

    vi.mocked(resolveProperty).mockReturnValue(true);

    const result = isIncluded(mockSchema, path, mockValues);

    expect(result).toBe(true);
    expect(resolveProperty).toHaveBeenCalledWith("included", path, true, {
      schema: mockSchema,
      values: mockValues,
    });
  });
});
