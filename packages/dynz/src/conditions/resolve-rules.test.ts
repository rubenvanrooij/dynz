import { describe, expect, it } from "vitest";
import { eq, v } from "../functions";
import { object, string } from "../schemas";
import type { ResolveContext } from "../types";
import { resolveRules } from "./resolve-rules";

describe("resolveRules", () => {
  const mockContext: ResolveContext = {
    schema: object({ fields: {} }),
    values: {
      new: { user: { role: "admin", age: 30 } },
    },
  };

  describe("unconditional rules", () => {
    it("should return all unconditional rules", () => {
      const schema = string({
        rules: [
          { type: "min_length", min: v(5) },
          { type: "max_length", max: v(50) },
        ],
      });

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([
        { type: "min_length", min: v(5) },
        { type: "max_length", max: v(50) },
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
      const thenRule = { type: "max_length" as const, max: v(100) };
      const schema = string({
        rules: [
          { type: "min_length", min: v(5) },
          {
            type: "conditional",
            cases: [
              {
                when: eq(v("admin"), v("admin")),
                then: thenRule,
              },
            ],
          },
        ],
      });

      const context: ResolveContext = {
        schema: object({ fields: {} }),
        values: { new: {} },
      };

      const result = resolveRules(schema, "$.test", context);

      expect(result).toEqual([{ type: "min_length", min: v(5) }, thenRule]);
    });

    it("should exclude conditional rule when condition is false", () => {
      const thenRule = { type: "max_length" as const, max: v(100) };
      const schema = string({
        rules: [
          { type: "min_length", min: v(5) },
          {
            type: "conditional",
            cases: [
              {
                when: eq(v("admin"), v("user")),
                then: thenRule,
              },
            ],
          },
        ],
      });

      const context: ResolveContext = {
        schema: object({ fields: {} }),
        values: { new: {} },
      };

      const result = resolveRules(schema, "$.test", context);

      expect(result).toEqual([{ type: "min_length", min: v(5) }]);
    });
  });

  describe("performance and behavior", () => {
    it("should not process conditional rules for unconditional-only schemas", () => {
      const schema = string({
        rules: [{ type: "min_length", min: v(5) }],
      });

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([{ type: "min_length", min: v(5) }]);
    });
  });
});
