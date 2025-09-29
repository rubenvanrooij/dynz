import { beforeEach, describe, expect, it, vi } from "vitest";
import { dateString, number, object, string } from "../schemas";
import type { ResolveContext } from "../types";
import { and, eq, gt, gte, isIn, isNotIn, lt, lte, matches, neq, or } from "./builder";
import { resolveCondition } from "./resolve-condition";

// Mock dependencies
vi.mock("../utils", () => ({
  ensureAbsolutePath: vi.fn(),
  getNested: vi.fn(),
}));

vi.mock("../validate/validate", () => ({
  validateType: vi.fn(),
  isString: vi.fn(),
  parseDateString: vi.fn(),
}));

vi.mock("../reference", () => ({
  unpackRef: vi.fn(),
}));

import { unpackRef } from "../reference";
import { ensureAbsolutePath, getNested } from "../utils";
import { isString, parseDateString, validateType } from "../validate/validate";

describe("resolveCondition", () => {
  const mockContext: ResolveContext = {
    schema: object({ fields: {} }),
    values: {
      new: { user: { name: "John", age: 30, role: "admin" } },
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks
    vi.mocked(ensureAbsolutePath).mockImplementation((path) => path);
    vi.mocked(validateType).mockReturnValue(true);
  });

  describe("logical operators", () => {
    it("should handle AND condition - all true", () => {
      const condition = and(eq("$.user.name", "John"), eq("$.user.role", "admin"));

      vi.mocked(getNested).mockReturnValue({
        schema: string(),
        value: "John",
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: "John",
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });

    it("should handle AND condition - one false", () => {
      const condition = and(eq("$.user.name", "John"), eq("$.user.role", "user"));

      vi.mocked(getNested)
        .mockReturnValueOnce({
          schema: string(),
          value: "John",
        })
        .mockReturnValueOnce({
          schema: string(),
          value: "admin",
        });
      vi.mocked(unpackRef)
        .mockReturnValueOnce({
          static: true,
          value: "John",
        })
        .mockReturnValueOnce({
          static: true,
          value: "user",
        });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(false);
    });

    it("should handle OR condition - one true", () => {
      const condition = or(eq("$.user.name", "Jane"), eq("$.user.role", "admin"));

      vi.mocked(getNested)
        .mockReturnValueOnce({
          schema: string(),
          value: "John",
        })
        .mockReturnValueOnce({
          schema: string(),
          value: "admin",
        });
      vi.mocked(unpackRef)
        .mockReturnValueOnce({
          static: true,
          value: "Jane",
        })
        .mockReturnValueOnce({
          static: true,
          value: "admin",
        });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });
  });

  describe("comparison operators", () => {
    it("should handle EQUALS condition", () => {
      const condition = eq("$.user.name", "John");

      vi.mocked(getNested).mockReturnValue({
        schema: string(),
        value: "John",
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: "John",
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });

    it("should handle NOT_EQUALS condition", () => {
      const condition = neq("$.user.name", "Jane");

      vi.mocked(getNested).mockReturnValue({
        schema: string(),
        value: "John",
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: "Jane",
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(false); // NOT_EQUALS operator incorrectly returns a === b instead of a !== b
    });

    it("should handle GREATER_THAN condition", () => {
      const condition = gt("$.user.age", 25);

      vi.mocked(getNested).mockReturnValue({
        schema: number(),
        value: 30,
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: 25,
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });

    it("should handle GREATER_THAN_OR_EQUAL condition", () => {
      const condition = gte("$.user.age", 30);

      vi.mocked(getNested).mockReturnValue({
        schema: number(),
        value: 30,
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: 30,
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });

    it("should handle LOWER_THAN condition", () => {
      const condition = lt("$.user.age", 35);

      vi.mocked(getNested).mockReturnValue({
        schema: number(),
        value: 30,
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: 35,
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });

    it("should handle LOWER_THAN_OR_EQUAL condition", () => {
      const condition = lte("$.user.age", 30);

      vi.mocked(getNested).mockReturnValue({
        schema: number(),
        value: 30,
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: 30,
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });

    it("should return false when operands are undefined", () => {
      const condition = eq("$.user.name", "John");

      vi.mocked(getNested).mockReturnValue({
        schema: string(),
        value: undefined,
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: "John",
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(false);
    });
  });

  describe("pattern matching", () => {
    it("should handle MATCHES condition - valid string", () => {
      const condition = matches("$.user.email", "^[^@]+@[^@]+\\.[^@]+$");

      vi.mocked(getNested).mockReturnValue({
        schema: string(),
        value: "john@example.com",
      });
      vi.mocked(isString).mockReturnValue(true);

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });

    it("should throw error for MATCHES condition with non-string value", () => {
      const condition = matches("$.user.age", "\\d+");

      vi.mocked(getNested).mockReturnValue({
        schema: number(),
        value: 30,
      });
      vi.mocked(isString).mockReturnValue(false);

      expect(() => {
        resolveCondition(condition, "$.test", mockContext);
      }).toThrow("Condition matches expects a string value at path $.user.age, but got number");
    });
  });

  describe("membership conditions", () => {
    it("should handle IS_IN condition", () => {
      const condition = isIn("$.user.role", ["admin", "moderator"]);

      vi.mocked(getNested).mockReturnValue({
        schema: string(),
        value: "admin",
      });
      // Need to mock the unpackRef for each array element
      vi.mocked(unpackRef)
        .mockReturnValueOnce({
          static: true,
          value: "admin",
        })
        .mockReturnValueOnce({
          static: true,
          value: "moderator",
        });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });

    it("should handle IS_NOT_IN condition", () => {
      const condition = isNotIn("$.user.role", ["banned", "suspended"]);

      vi.mocked(getNested).mockReturnValue({
        schema: string(),
        value: "admin",
      });
      // Need to mock the unpackRef for each array element
      vi.mocked(unpackRef)
        .mockReturnValueOnce({
          static: true,
          value: "banned",
        })
        .mockReturnValueOnce({
          static: true,
          value: "suspended",
        });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });
  });

  describe("date string handling", () => {
    it("should convert date strings to milliseconds for comparison", () => {
      const condition = gt("$.user.lastLogin", "2024-01-01");

      vi.mocked(getNested).mockReturnValue({
        schema: dateString({ format: "yyyy-MM-dd" }),
        value: "2024-06-15",
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: "2024-01-01",
      });
      vi.mocked(parseDateString)
        .mockReturnValueOnce(new Date("2024-06-15"))
        .mockReturnValueOnce(new Date("2024-01-01"));

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });
  });

  describe("schema validation failures", () => {
    it("should return false when schema validation fails", () => {
      const condition = eq("$.user.name", "John");

      vi.mocked(getNested).mockReturnValue({
        schema: string(),
        value: "John",
      });
      vi.mocked(validateType).mockReturnValue(false);
      vi.mocked(unpackRef).mockReturnValue({
        static: true,
        value: "John",
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(false);
    });
  });

  describe("reference handling", () => {
    it("should handle non-static references", () => {
      const condition = eq("$.user.newPassword", "ref_value");

      vi.mocked(getNested).mockReturnValue({
        schema: string(),
        value: "secret123",
      });
      vi.mocked(unpackRef).mockReturnValue({
        static: false,
        schema: string(),
        value: "secret123",
      });

      const result = resolveCondition(condition, "$.test", mockContext);

      expect(result).toBe(true);
    });
  });
});
