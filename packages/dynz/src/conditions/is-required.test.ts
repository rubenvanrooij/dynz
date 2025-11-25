import { beforeEach, describe, expect, it, vi } from "vitest";
import { object, string } from "../schemas";
import { isRequired } from "./is-required";

// Mock dependencies
vi.mock("../utils", () => ({
  getNested: vi.fn(),
}));

vi.mock("./resolve-property", () => ({
  resolveProperty: vi.fn(),
}));

import { getNested } from "../utils";
import { resolveProperty } from "./resolve-property";

describe("isRequired", () => {
  const mockSchema = object({
    fields: {
      name: string({ required: true }),
      email: string({ required: false }),
    },
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
    const nestedSchema = string({ required: true });

    vi.mocked(getNested).mockReturnValue({
      schema: nestedSchema,
      value: "John",
    });
    vi.mocked(resolveProperty).mockReturnValue(true);

    const result = isRequired(mockSchema, path, mockValues);

    expect(result).toBe(true);
    expect(resolveProperty).toHaveBeenCalledWith(nestedSchema, "required", path, true, {
      schema: mockSchema,
      values: {
        new: mockValues,
      },
    });
  });
});
