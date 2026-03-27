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

  const nestedSchema = string({ included: true });
  const parentSchema = object({ fields: { name: nestedSchema } });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return true when all ancestors and leaf are included", () => {
    const path = "$.user.name";

    vi.mocked(getNested).mockReturnValue({ schema: nestedSchema, value: "John" });
    vi.mocked(resolveProperty).mockReturnValue(true);

    const result = isIncluded(mockSchema, path, mockValues);

    expect(result).toBe(true);
    // Called once for "$.user" and once for "$.user.name"
    expect(getNested).toHaveBeenCalledTimes(2);
    expect(resolveProperty).toHaveBeenCalledTimes(2);
  });

  it("should return false when the leaf schema is not included", () => {
    const path = "$.user.name";

    vi.mocked(getNested).mockReturnValue({ schema: nestedSchema, value: "John" });
    vi.mocked(resolveProperty)
      .mockReturnValueOnce(true) // $.user is included
      .mockReturnValueOnce(false); // $.user.name is not included

    const result = isIncluded(mockSchema, path, mockValues);

    expect(result).toBe(false);
  });

  it("should return false when a parent schema is not included", () => {
    const path = "$.user.name";

    vi.mocked(getNested).mockReturnValue({ schema: parentSchema, value: mockValues.user });
    vi.mocked(resolveProperty).mockReturnValueOnce(false); // $.user is not included

    const result = isIncluded(mockSchema, path, mockValues);

    expect(result).toBe(false);
    // Short-circuits after parent check fails
    expect(resolveProperty).toHaveBeenCalledTimes(1);
  });

  it("should check only the leaf for a top-level path", () => {
    const path = "$.name";

    vi.mocked(getNested).mockReturnValue({ schema: nestedSchema, value: "John" });
    vi.mocked(resolveProperty).mockReturnValue(true);

    const result = isIncluded(mockSchema, path, mockValues);

    expect(result).toBe(true);
    expect(getNested).toHaveBeenCalledTimes(1);
    expect(resolveProperty).toHaveBeenCalledWith(nestedSchema, "included", "$.name", true, {
      schema: mockSchema,
      values: mockValues,
    });
  });
});
