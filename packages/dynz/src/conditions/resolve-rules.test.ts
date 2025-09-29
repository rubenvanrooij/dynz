import { beforeEach, describe, expect, it, vi } from "vitest";
import { object, string } from "../schemas";
import type { ResolveContext } from "../types";
import { eq } from "./builder";
import { resolveRules } from "./resolve-rules";

// Mock dependencies
vi.mock("./resolve-condition", () => ({
  resolveCondition: vi.fn(),
}));

import { resolveCondition } from "./resolve-condition";

describe("resolveRules", () => {
  const mockContext: ResolveContext = {
    schema: object({ fields: {} }),
    values: {
      new: { user: { role: "admin", age: 30 } },
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("unconditional rules", () => {
    it("should return all unconditional rules", () => {
      const schema = string({
        rules: [
          { type: "min_length", min: 5 },
          { type: "max_length", max: 50 },
        ],
      });

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([
        { type: "min_length", min: 5 },
        { type: "max_length", max: 50 },
      ]);
    });

    it("should return empty array when no rules are defined", () => {
      const schema = string();

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([]);
    });

    it("should return empty array when rules array is empty", () => {
      const schema = string({ rules: [] });

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([]);
    });
  });

  describe("conditional rules", () => {
    it("should include conditional rule when condition is true", () => {
      const condition = eq("$.user.role", "admin");
      const schema = string({
        rules: [
          { type: "min_length", min: 5 },
          {
            type: "conditional",
            when: condition,
            then: { type: "max_length", max: 100 },
          },
        ],
      });

      vi.mocked(resolveCondition).mockReturnValue(true);

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([
        { type: "min_length", min: 5 },
        { type: "max_length", max: 100 },
      ]);
      expect(resolveCondition).toHaveBeenCalledWith(condition, "$.test", mockContext);
    });

    it("should exclude conditional rule when condition is false", () => {
      const condition = eq("$.user.role", "user");
      const schema = string({
        rules: [
          { type: "min_length", min: 5 },
          {
            type: "conditional",
            when: condition,
            then: { type: "max_length", max: 100 },
          },
        ],
      });

      vi.mocked(resolveCondition).mockReturnValue(false);

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([{ type: "min_length", min: 5 }]);
      expect(resolveCondition).toHaveBeenCalledWith(condition, "$.test", mockContext);
    });
  });

  describe("performance and behavior", () => {
    it("should not call resolveCondition for unconditional rules", () => {
      const schema = string({
        rules: [{ type: "min_length", min: 5 }],
      });

      resolveRules(schema, "$.test", mockContext);

      expect(resolveCondition).not.toHaveBeenCalled();
    });

    it("should call resolveCondition for conditional rules", () => {
      const condition = eq("$.a", 1);
      const schema = string({
        rules: [
          {
            type: "conditional",
            when: condition,
            then: { type: "min_length", min: 5 },
          },
        ],
      });

      vi.mocked(resolveCondition).mockReturnValue(true);

      resolveRules(schema, "$.test", mockContext);

      expect(resolveCondition).toHaveBeenCalledWith(condition, "$.test", mockContext);
    });
  });
});
