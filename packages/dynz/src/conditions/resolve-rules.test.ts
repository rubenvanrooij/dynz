import { describe, expect, it } from "vitest";
import { eq, v } from "../functions";
import { object, string } from "../schemas";
import type { ResolveContext } from "../types";
import { resolveRules } from "./resolve-rules";

describe("resolveRules", () => {
  const mockContext: ResolveContext = {
    schema: object({}),
    values: {
      new: { user: { role: "admin", age: 30 } },
    },
  };

  describe("unconditional rules", () => {
    it("should return all unconditional rules", () => {
      const schema = string().min(5).max(50);

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([
        { type: "min_length", min: v(5), code: undefined },
        { type: "max_length", max: v(50), code: undefined },
      ]);
    });

    it("should return empty array when no rules are defined", () => {
      const schema = string();

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([]);
    });

    it("should return empty array when rules array is empty", () => {
      const schema = string();

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([]);
    });
  });

  describe("conditional rules", () => {
    it("should include conditional rule when condition is true", () => {
      const schema = string()
        .min(5)
        .when(eq(v("admin"), v("admin")), (b) => b.max(100));

      const context: ResolveContext = {
        schema: object({}),
        values: { new: {} },
      };

      const result = resolveRules(schema, "$.test", context);

      expect(result).toEqual([
        { type: "min_length", min: v(5), code: undefined },
        { type: "max_length", max: v(100), code: undefined },
      ]);
    });

    it("should exclude conditional rule when condition is false", () => {
      const schema = string()
        .min(5)
        .when(eq(v("admin"), v("user")), (b) => b.max(100));

      const context: ResolveContext = {
        schema: object({}),
        values: { new: {} },
      };

      const result = resolveRules(schema, "$.test", context);

      expect(result).toEqual([{ type: "min_length", min: v(5), code: undefined }]);
    });
  });

  describe("performance and behavior", () => {
    it("should not process conditional rules for unconditional-only schemas", () => {
      const schema = string().min(5);

      const result = resolveRules(schema, "$.test", mockContext);

      expect(result).toEqual([{ type: "min_length", min: v(5), code: undefined }]);
    });
  });
});
