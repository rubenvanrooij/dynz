import { beforeEach, describe, expect, it, vi } from "vitest";
import { object, string } from "../schemas";
import { isRequired } from "./is-required";

// Mock dependencies
vi.mock("./resolve-property", () => ({
  resolveProperty: vi.fn(),
}));

import { resolveProperty } from "./resolve-property";

describe("isRequired", () => {
  const mockSchema = object({
    name: string().setRequired(true),
    email: string().optional(),
  });

  const mockValues = {
    name: "John",
    email: "john@example.com",
    age: 30,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return result from resolveProperty", () => {
    const path = "$.user.name";

    vi.mocked(resolveProperty).mockReturnValue(true);

    const result = isRequired(mockSchema, path, mockValues);

    expect(result).toBe(true);
    expect(resolveProperty).toHaveBeenCalledWith("required", path, true, {
      schema: mockSchema,
      values: mockValues,
    });
  });
});
