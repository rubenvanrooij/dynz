import { describe, expect, it } from "vitest";
import { object } from "../schemas";
import { type ResolveContext, SchemaType } from "../types";
import { ref } from "./reference";
import { unpackRef } from "./unpack-reference";

describe("unpackRef", () => {
  describe("static values (non-references)", () => {
    const mockContext: ResolveContext = {
      schema: object({ fields: {} }),
      values: { new: {} },
    };

    it("should return static value for string", () => {
      const result = unpackRef("test string", "path", mockContext);

      expect(result).toEqual({
        value: "test string",
        static: true,
      });
    });

    it("should return static value for number", () => {
      const result = unpackRef(42, "path", mockContext);

      expect(result).toEqual({
        value: 42,
        static: true,
      });
    });

    it("should return static value for boolean", () => {
      const result = unpackRef(true, "path", mockContext);

      expect(result).toEqual({
        value: true,
        static: true,
      });
    });

    it("should return static value for object", () => {
      const obj = { key: "value" };
      const result = unpackRef(obj, "path", mockContext);

      expect(result).toEqual({
        value: obj,
        static: true,
      });
    });

    it("should return static value for array", () => {
      const arr = [1, 2, 3];
      const result = unpackRef(arr, "path", mockContext);

      expect(result).toEqual({
        value: arr,
        static: true,
      });
    });

    it("should return static value for Date objects", () => {
      const date = new Date("2024-01-01");
      const result = unpackRef(date, "path", mockContext);

      expect(result).toEqual({
        value: date,
        static: true,
      });
    });
  });

  describe("static values with expected types", () => {
    const mockContext: ResolveContext = {
      schema: object({ fields: {} }),
      values: { new: {} },
    };

    it("should return static value even when expected type is provided", () => {
      const result = unpackRef("static string", "path", mockContext, SchemaType.STRING);

      expect(result).toEqual({
        value: "static string",
        static: true,
      });
    });

    it("should return static value for numbers with expected type", () => {
      const result = unpackRef(42, "path", mockContext, SchemaType.NUMBER);

      expect(result).toEqual({
        value: 42,
        static: true,
      });
    });
  });

  describe("unpackRef with multiple expected types", () => {
    const mockContext: ResolveContext = {
      schema: object({ fields: {} }),
      values: { new: {} },
    };

    it("should handle static values with multiple expected types", () => {
      const result = unpackRef("test", "path", mockContext, SchemaType.STRING, SchemaType.NUMBER);

      expect(result).toEqual({
        value: "test",
        static: true,
      });
    });

    it("should handle static values with array of expected types", () => {
      const result = unpackRef(42, "path", mockContext, SchemaType.DATE, SchemaType.NUMBER, SchemaType.STRING);

      expect(result).toEqual({
        value: 42,
        static: true,
      });
    });

    it("should handle Date objects with multiple expected types", () => {
      const date = new Date("2024-01-01");
      const result = unpackRef(date, "path", mockContext, SchemaType.DATE, SchemaType.DATE_STRING);

      expect(result).toEqual({
        value: date,
        static: true,
      });
    });

    it("should return static value regardless of expected type mismatch", () => {
      // Static values are returned as-is, without type checking
      const result = unpackRef("string", "path", mockContext, SchemaType.NUMBER);

      expect(result).toEqual({
        value: "string",
        static: true,
      });
    });
  });

  describe("reference handling in cross-type scenarios", () => {
    it("should identify references correctly", () => {
      const mockContext: ResolveContext = {
        schema: object({ fields: {} }),
        values: { new: {} },
      };

      const reference = ref("$.nonexistent");

      // Even though the path doesn't exist, we can test that it recognizes it as a reference
      // and returns a non-static result
      expect(() => unpackRef(reference, "path", mockContext)).toThrow();
    });

    it("should handle empty references gracefully", () => {
      const mockContext: ResolveContext = {
        schema: object({ fields: {} }),
        values: { new: {} },
      };

      // Test edge case of empty reference
      const reference = ref("");
      const result = unpackRef(reference, "path", mockContext);

      expect(result.static).toBe(false);
    });
  });

  describe("edge cases for cross-type validation", () => {
    const mockContext: ResolveContext = {
      schema: object({ fields: {} }),
      values: { new: {} },
    };

    it("should handle zero values", () => {
      const result = unpackRef(0, "path", mockContext);

      expect(result).toEqual({
        value: 0,
        static: true,
      });
    });

    it("should handle empty string values", () => {
      const result = unpackRef("", "path", mockContext);

      expect(result).toEqual({
        value: "",
        static: true,
      });
    });

    it("should handle complex nested objects", () => {
      const complex = {
        nested: {
          array: [1, 2, { deep: "value" }],
          boolean: true,
        },
      };
      const result = unpackRef(complex, "path", mockContext);

      expect(result).toEqual({
        value: complex,
        static: true,
      });
    });

    it("should handle boolean values with type expectations", () => {
      const result = unpackRef(false, "path", mockContext, SchemaType.BOOLEAN, SchemaType.STRING);

      expect(result).toEqual({
        value: false,
        static: true,
      });
    });
  });
});
