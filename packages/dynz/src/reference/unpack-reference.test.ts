import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ResolveContext, SchemaType } from "../types";
import { ref } from "./reference";
import { unpackRef } from "./unpack-reference";

// Mock the dependencies
vi.mock("../utils", () => ({
  coerce: vi.fn(),
  coerceSchema: vi.fn(),
  ensureAbsolutePath: vi.fn(),
  getNested: vi.fn(),
}));

vi.mock("../validate/validate", () => ({
  validateType: vi.fn(),
}));

import { object, string } from "../schemas";
// Import mocked functions
import { coerce, coerceSchema, ensureAbsolutePath, getNested } from "../utils";
import { validateType } from "../validate/validate";

describe("unpackRef", () => {
  const mockContext: ResolveContext = {
    schema: { type: "object", fields: {} },
    values: {
      new: { user: { name: "John", age: 30 } },
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("static values (non-references)", () => {
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
  });

  describe("reference resolution without expected type", () => {
    beforeEach(() => {
      vi.mocked(ensureAbsolutePath).mockReturnValue("$.resolved.path");
      vi.mocked(getNested).mockReturnValue({
        schema: { type: "string" },
        value: "resolved value",
      });
      vi.mocked(coerceSchema).mockReturnValue("coerced value");
      vi.mocked(validateType).mockReturnValue(true);
    });

    it("should resolve reference and return dynamic value", () => {
      const reference = ref("user.name");

      const result = unpackRef(reference, "current.path", mockContext);

      expect(ensureAbsolutePath).toHaveBeenCalledWith("user.name", "current.path");
      expect(getNested).toHaveBeenCalledWith("$.resolved.path", mockContext.schema, mockContext.values.new);
      expect(coerceSchema).toHaveBeenCalledWith({ type: "string" }, "resolved value");
      expect(validateType).toHaveBeenCalledWith("string", "coerced value");

      expect(result).toEqual({
        schema: { type: "string" },
        value: "coerced value",
        static: false,
      });
    });

    it("should return undefined value when validation fails", () => {
      const reference = ref("user.name");
      vi.mocked(validateType).mockReturnValue(false);

      const result = unpackRef(reference, "current.path", mockContext);

      expect(result).toEqual({
        schema: { type: "string" },
        value: undefined,
        static: false,
      });
    });

    it("should handle complex reference paths", () => {
      const reference = ref("$.data.users[0].profile.name");

      unpackRef(reference, "$.current.field", mockContext);

      expect(ensureAbsolutePath).toHaveBeenCalledWith("$.data.users[0].profile.name", "$.current.field");
    });
  });

  describe("reference resolution with expected type", () => {
    beforeEach(() => {
      vi.mocked(ensureAbsolutePath).mockReturnValue("$.resolved.path");
      vi.mocked(getNested).mockReturnValue({
        schema: { type: "number" },
        value: "123",
      });
      vi.mocked(coerce).mockReturnValue(123);
      vi.mocked(validateType).mockReturnValue(true);
    });

    it("should resolve reference with type coercion", () => {
      const reference = ref("user.age");

      const result = unpackRef(reference, "current.path", mockContext, SchemaType.NUMBER);

      expect(ensureAbsolutePath).toHaveBeenCalledWith("user.age", "current.path");
      expect(getNested).toHaveBeenCalledWith("$.resolved.path", mockContext.schema, mockContext.values.new);
      expect(coerce).toHaveBeenCalledWith(SchemaType.NUMBER, "123");
      expect(validateType).toHaveBeenCalledWith(SchemaType.NUMBER, 123);

      expect(result).toEqual({
        schema: { type: "number" },
        value: 123,
        static: false,
      });
    });

    it("should return undefined when type validation fails", () => {
      const reference = ref("user.invalidField");
      vi.mocked(validateType).mockReturnValue(false);

      const result = unpackRef(reference, "current.path", mockContext, SchemaType.STRING);

      expect(result).toEqual({
        schema: { type: "number" },
        value: undefined,
        static: false,
      });
    });

    it("should handle different schema types", () => {
      const reference = ref("user.isActive");

      // Test with BOOLEAN type
      unpackRef(reference, "path", mockContext, SchemaType.BOOLEAN);
      expect(coerce).toHaveBeenCalledWith(SchemaType.BOOLEAN, "123");

      vi.clearAllMocks();
      vi.mocked(ensureAbsolutePath).mockReturnValue("$.resolved.path");
      vi.mocked(getNested).mockReturnValue({ schema: { type: "boolean" }, value: true });
      vi.mocked(coerce).mockReturnValue(true);
      vi.mocked(validateType).mockReturnValue(true);

      // Test with DATE type
      unpackRef(reference, "path", mockContext, SchemaType.DATE);
      expect(coerce).toHaveBeenCalledWith(SchemaType.DATE, true);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle reference to non-existent path", () => {
      const reference = ref("nonexistent.path");

      vi.mocked(ensureAbsolutePath).mockReturnValue("$.nonexistent.path");
      vi.mocked(getNested).mockReturnValue({
        schema: { type: "string" },
        value: undefined,
      });
      vi.mocked(coerceSchema).mockReturnValue(undefined);
      vi.mocked(validateType).mockReturnValue(false);

      const result = unpackRef(reference, "current.path", mockContext);

      expect(result).toEqual({
        schema: { type: "string" },
        value: undefined,
        static: false,
      });
    });

    it("should handle reference with empty path", () => {
      const reference = ref("");

      vi.mocked(ensureAbsolutePath).mockReturnValue("$");
      vi.mocked(getNested).mockReturnValue({
        schema: mockContext.schema,
        value: mockContext.values.new,
      });
      vi.mocked(coerceSchema).mockReturnValue(mockContext.values.new);
      vi.mocked(validateType).mockReturnValue(true);

      const result = unpackRef(reference, "current.path", mockContext);

      expect(result).toEqual({
        schema: mockContext.schema,
        value: mockContext.values.new,
        static: false,
      });
    });

    it("should handle nested object references", () => {
      const reference = ref("user.profile.settings");
      const nestedSchema = object({
        fields: {
          theme: string(),
        },
      });
      const nestedValue = { theme: "dark" };

      vi.mocked(ensureAbsolutePath).mockReturnValue("$.user.profile.settings");
      vi.mocked(getNested).mockReturnValue({
        schema: nestedSchema,
        value: nestedValue,
      });
      vi.mocked(coerceSchema).mockReturnValue(nestedValue);
      vi.mocked(validateType).mockReturnValue(true);

      const result = unpackRef(reference, "current.path", mockContext);

      expect(result).toEqual({
        schema: nestedSchema,
        value: nestedValue,
        static: false,
      });
    });

    it("should handle array element references", () => {
      const reference = ref("users[0]");
      const arrayElementSchema = object({
        fields: {
          name: string(),
        },
      });

      const arrayElementValue = { name: "First User" };

      vi.mocked(ensureAbsolutePath).mockReturnValue("$.users[0]");
      vi.mocked(getNested).mockReturnValue({
        schema: arrayElementSchema,
        value: arrayElementValue,
      });
      vi.mocked(coerceSchema).mockReturnValue(arrayElementValue);
      vi.mocked(validateType).mockReturnValue(true);

      const result = unpackRef(reference, "current.path", mockContext);

      expect(result).toEqual({
        schema: arrayElementSchema,
        value: arrayElementValue,
        static: false,
      });
    });
  });

  describe("type safety and overloads", () => {
    it("should maintain type safety for static values with expected type", () => {
      const result = unpackRef("string value", "path", mockContext, SchemaType.STRING);

      expect(result).toEqual({
        value: "string value",
        static: true,
      });
    });

    it("should work with generic value types", () => {
      interface CustomType extends Record<string, unknown> {
        id: number;
        name: string;
      }

      const customValue: CustomType = { id: 1, name: "test" };
      const result = unpackRef(customValue, "path", mockContext);

      expect(result).toEqual({
        value: customValue,
        static: true,
      });
    });

    it("should handle mixed reference and value scenarios", () => {
      // Static value
      const staticResult = unpackRef(42, "path", mockContext, SchemaType.NUMBER);
      expect(staticResult.static).toBe(true);

      // Reference value
      const reference = ref("dynamic.value");
      vi.mocked(ensureAbsolutePath).mockReturnValue("$.dynamic.value");
      vi.mocked(getNested).mockReturnValue({
        schema: { type: "number" },
        value: 42,
      });
      vi.mocked(coerce).mockReturnValue(42);
      vi.mocked(validateType).mockReturnValue(true);

      const dynamicResult = unpackRef(reference, "path", mockContext, SchemaType.NUMBER);
      expect(dynamicResult.static).toBe(false);
    });
  });

  describe("integration with schema validation", () => {
    it("should properly integrate with coercion and validation flow", () => {
      const reference = ref("user.stringifiedNumber");

      vi.mocked(ensureAbsolutePath).mockReturnValue("$.user.stringifiedNumber");
      vi.mocked(getNested).mockReturnValue({
        schema: { type: "string" },
        value: "123",
      });
      vi.mocked(coerce).mockReturnValue(123);
      vi.mocked(validateType).mockReturnValue(true);

      const result = unpackRef(reference, "path", mockContext, SchemaType.NUMBER);

      // Verify the full flow
      expect(ensureAbsolutePath).toHaveBeenCalledWith("user.stringifiedNumber", "path");
      expect(getNested).toHaveBeenCalledWith("$.user.stringifiedNumber", mockContext.schema, mockContext.values.new);
      expect(coerce).toHaveBeenCalledWith(SchemaType.NUMBER, "123");
      expect(validateType).toHaveBeenCalledWith(SchemaType.NUMBER, 123);

      expect(result).toEqual({
        schema: { type: "string" },
        value: 123,
        static: false,
      });
    });

    it("should handle validation failure gracefully", () => {
      const reference = ref("user.invalidData");

      vi.mocked(ensureAbsolutePath).mockReturnValue("$.user.invalidData");
      vi.mocked(getNested).mockReturnValue({
        schema: { type: "string" },
        value: "not a number",
      });
      vi.mocked(coerce).mockReturnValue(NaN);
      vi.mocked(validateType).mockReturnValue(false);

      const result = unpackRef(reference, "path", mockContext, SchemaType.NUMBER);

      expect(result).toEqual({
        schema: { type: "string" },
        value: undefined,
        static: false,
      });
    });
  });
});
