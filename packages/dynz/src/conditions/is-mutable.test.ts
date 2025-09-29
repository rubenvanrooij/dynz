import { beforeEach, describe, expect, it, vi } from "vitest";
import { object, string } from "../schemas";
import { isMutable } from "./is-mutable";

// Mock dependencies
vi.mock("../utils", () => ({
  getNested: vi.fn(),
}));

vi.mock("./resolve-property", () => ({
  resolveProperty: vi.fn(),
}));

import { getNested } from "../utils";
import { resolveProperty } from "./resolve-property";

describe("isMutable", () => {
  const mockSchema = object({
    fields: {
      name: string({ mutable: true }),
      id: string({ mutable: false }),
    },
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
    const nestedSchema = string({ mutable: true });

    vi.mocked(getNested).mockReturnValue({
      schema: nestedSchema,
      value: "John",
    });
    vi.mocked(resolveProperty).mockReturnValue(true);

    const result = isMutable(mockSchema, path, mockValues);

    expect(result).toBe(true);
    expect(resolveProperty).toHaveBeenCalledWith(nestedSchema, "mutable", path, true, {
      schema: mockSchema,
      values: {
        new: mockValues,
      },
    });
  });
});
