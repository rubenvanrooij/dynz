import { beforeEach, describe, expect, it, vi } from "vitest";
import { object, string } from "../schemas";
import { isIncluded } from "./is-included";

// Mock dependencies
vi.mock("../utils", () => ({
  getNested: vi.fn(),
}));

vi.mock("./resolve-property", () => ({
  resolveProperty: vi.fn(),
}));

import { getNested } from "../utils";
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

  it("should return result from resolveProperty", () => {
    const path = "$.user.name";
    const nestedSchema = string({ included: true });

    vi.mocked(getNested).mockReturnValue({
      schema: nestedSchema,
      value: "John",
    });
    vi.mocked(resolveProperty).mockReturnValue(true);

    const result = isIncluded(mockSchema, path, mockValues);

    expect(result).toBe(true);
    expect(resolveProperty).toHaveBeenCalledWith(nestedSchema, "included", path, true, {
      schema: mockSchema,
      values: {
        new: mockValues,
      },
    });
  });
});
