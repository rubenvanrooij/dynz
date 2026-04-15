import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValueMasked, mask, plain } from "../private";
import { array, date, number, object, string } from "../schemas";
import { ErrorCode, SchemaType } from "../types";
import { validate } from "./validate";
import {
  isArray,
  isBoolean,
  isDate,
  isDateString,
  isFile,
  isNumber,
  isObject,
  isString,
  validateShallowType,
} from "./validate-type";

describe("validate", () => {
  beforeEach(() => {
    vi.stubEnv("TZ", "UTC");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("basic validation", () => {
    it("should validate a simple string schema", async () => {
      const schema = string();
      const result = await validate(schema, undefined, "hello");

      expect(result).toEqual({
        success: true,
        values: "hello",
      });
    });

    it("should validate a simple number schema", async () => {
      const schema = number();
      const result = await validate(schema, undefined, 42);

      expect(result).toEqual({
        success: true,
        values: 42,
      });
    });

    it("should validate an object schema", async () => {
      const schema = object({
        name: string(),
        age: number(),
      });
      const result = await validate(schema, undefined, {
        name: "John",
        age: 30,
      });

      expect(result).toEqual({
        success: true,
        values: { name: "John", age: 30 },
      });
    });

    it("should validate an array schema", async () => {
      const schema = array(string());
      const result = await validate(schema, undefined, ["hello", "world"]);

      expect(result).toEqual({
        success: true,
        values: ["hello", "world"],
      });
    });

    it("should handle undefined values for optional schemas", async () => {
      const schema = string().optional();
      const result = await validate(schema, undefined, undefined);

      expect(result).toEqual({
        success: true,
        values: undefined,
      });
    });
  });

  describe("required validation", () => {
    it("should fail when required field is missing", async () => {
      const schema = string().setRequired(true);
      const result = await validate(schema, undefined, undefined);

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.REQRUIED,
            path: "$",
          }),
        ],
      });
    });

    it("should pass when required field is present", async () => {
      const schema = string().setRequired(true);
      const result = await validate(schema, undefined, "hello");

      expect(result.success).toBe(true);
    });

    it("should pass when optional field is missing", async () => {
      const schema = string().optional();
      const result = await validate(schema, undefined, undefined);

      expect(result.success).toBe(true);
    });
  });

  describe("type validation", () => {
    it("should fail when string value is not a string", async () => {
      const schema = string();
      const result = await validate(schema, undefined, 42);

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.STRING,
          }),
        ],
      });
    });

    it("should fail when number value is not a number", async () => {
      const schema = number();
      const result = await validate(schema, undefined, "not a number");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.NUMBER,
          }),
        ],
      });
    });

    it("should fail when object value is not an object", async () => {
      const schema = object({});
      const result = await validate(schema, undefined, "not an object");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.OBJECT,
          }),
        ],
      });
    });

    it("should fail when array value is not an array", async () => {
      const schema = array(string());
      const result = await validate(schema, undefined, "not an array");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.ARRAY,
          }),
        ],
      });
    });
  });

  describe("included validation", () => {
    it("should fail when value is provided for non-included schema", async () => {
      const schema = string().setIncluded(false);
      const result = await validate(schema, undefined, "hello");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.INCLUDED,
          }),
        ],
      });
    });

    it("should succeed when value is undefined for non-included schema", async () => {
      const schema = string().setIncluded(false);
      const result = await validate(schema, undefined, undefined);

      expect(result.success).toBe(true);
    });

    it("should strip non-included values when stripNotIncludedValues is true", async () => {
      const schema = string().setIncluded(false);
      const result = await validate(schema, undefined, "hello", {
        stripNotIncludedValues: true,
      });

      expect(result).toEqual({
        success: true,
        values: undefined,
      });
    });
  });

  describe("mutability validation", () => {
    it("should fail when non-mutable field changes", async () => {
      const schema = string().setMutable(false);
      const result = await validate(schema, "original", "changed");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.IMMUTABLE,
          }),
        ],
      });
    });

    it("should pass when non-mutable field stays the same", async () => {
      const schema = string().setMutable(false);
      const result = await validate(schema, "same", "same");

      expect(result.success).toBe(true);
    });
  });

  describe("nested object validation", () => {
    it("should validate nested object fields", async () => {
      const schema = object({
        user: object({
          name: string().setRequired(true),
          age: number().optional(),
        }),
      });

      const validResult = await validate(schema, undefined, {
        user: { name: "John", age: 30 },
      });
      expect(validResult.success).toBe(true);

      const invalidResult = await validate(schema, undefined, {
        user: { age: 30 },
      });
      expect(invalidResult).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.REQRUIED,
            path: "$.user.name",
          }),
        ],
      });
    });
  });

  describe("array validation", () => {
    it("should validate array elements", async () => {
      const schema = array(number());

      const validResult = await validate(schema, undefined, [1, 2, 3]);
      expect(validResult.success).toBe(true);

      const invalidResult = await validate(schema, undefined, [1, "not a number", 3]);
      expect(invalidResult).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.NUMBER,
            path: "$.[1]",
          }),
        ],
      });
    });
  });

  describe("private field validation", () => {
    it("should handle private fields with plain values", async () => {
      const schema = string().setPrivate(true);
      const result = await validate(schema, undefined, plain("secret"));

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values).toBe("secret");
      }
    });

    it("should handle private fields with masked values", async () => {
      const schema = string().setPrivate(true);
      const result = await validate(schema, undefined, mask());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values).toEqual(mask());
      }
    });

    it("should validate mutability of private fields", async () => {
      const schema = string().setPrivate(true).setMutable(false);
      const result = await validate(schema, plain("original"), plain("changed"));

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.IMMUTABLE,
          }),
        ],
      });
    });
  });

  describe("validateShallowType function", () => {
    describe("string validation", () => {
      it("should validate string type", async () => {
        expect(validateShallowType(SchemaType.STRING, "hello")).toBe(true);
        expect(validateShallowType(SchemaType.STRING, 123)).toBe(false);
        expect(validateShallowType(SchemaType.STRING, null)).toBe(false);
        expect(validateShallowType(SchemaType.STRING, undefined)).toBe(false);
      });
    });

    describe("number validation", () => {
      it("should validate number type", async () => {
        expect(validateShallowType(SchemaType.NUMBER, 123)).toBe(true);
        expect(validateShallowType(SchemaType.NUMBER, 123.45)).toBe(true);
        expect(validateShallowType(SchemaType.NUMBER, "123")).toBe(false);
        expect(validateShallowType(SchemaType.NUMBER, NaN)).toBe(false);
        expect(validateShallowType(SchemaType.NUMBER, Infinity)).toBe(false);
      });
    });

    describe("boolean validation", () => {
      it("should validate boolean type", async () => {
        expect(validateShallowType(SchemaType.BOOLEAN, true)).toBe(true);
        expect(validateShallowType(SchemaType.BOOLEAN, false)).toBe(true);
        expect(validateShallowType(SchemaType.BOOLEAN, "true")).toBe(false);
        expect(validateShallowType(SchemaType.BOOLEAN, 1)).toBe(false);
      });
    });

    describe("object validation", () => {
      it("should validate object type", async () => {
        expect(validateShallowType(SchemaType.OBJECT, {})).toBe(true);
        expect(validateShallowType(SchemaType.OBJECT, { key: "value" })).toBe(true);
        expect(validateShallowType(SchemaType.OBJECT, [])).toBe(false);
        expect(validateShallowType(SchemaType.OBJECT, null)).toBe(false);
      });
    });

    describe("array validation", () => {
      it("should validate array type", async () => {
        expect(validateShallowType(SchemaType.ARRAY, [])).toBe(true);
        expect(validateShallowType(SchemaType.ARRAY, [1, 2, 3])).toBe(true);
        expect(validateShallowType(SchemaType.ARRAY, {})).toBe(false);
        expect(validateShallowType(SchemaType.ARRAY, "array")).toBe(false);
      });
    });

    describe("date validation", () => {
      it("should validate date type", async () => {
        expect(validateShallowType(SchemaType.DATE, new Date())).toBe(true);
        expect(validateShallowType(SchemaType.DATE, new Date("2023-01-01"))).toBe(true);
        expect(validateShallowType(SchemaType.DATE, new Date("invalid"))).toBe(false);
        expect(validateShallowType(SchemaType.DATE, "2023-01-01")).toBe(false);
      });
    });

    describe("file validation", () => {
      it("should validate file type", async () => {
        const file = new File(["content"], "test.txt", { type: "text/plain" });
        expect(validateShallowType(SchemaType.FILE, file)).toBe(true);
        expect(validateShallowType(SchemaType.FILE, {})).toBe(false);
        expect(validateShallowType(SchemaType.FILE, "file")).toBe(false);
      });
    });

    describe("date string validation", () => {
      it("should validate date string type", async () => {
        expect(validateShallowType(SchemaType.DATE_STRING, "2023-01-01")).toBe(true);
        expect(validateShallowType(SchemaType.DATE_STRING, "01/01/2023")).toBe(true);
      });
    });

    describe("options validation", () => {
      it("should validate options type", async () => {
        expect(validateShallowType(SchemaType.OPTIONS, "option1")).toBe(true);
        expect(validateShallowType(SchemaType.OPTIONS, 1)).toBe(true);
        expect(validateShallowType(SchemaType.OPTIONS, true)).toBe(true);
        expect(validateShallowType(SchemaType.OPTIONS, {})).toBe(false);
        expect(validateShallowType(SchemaType.OPTIONS, [])).toBe(false);
      });
    });
  });

  describe("type checking functions", () => {
    describe("isString", () => {
      it("should return true for strings", async () => {
        expect(isString("hello")).toBe(true);
        expect(isString("")).toBe(true);
      });

      it("should return false for non-strings", async () => {
        expect(isString(123)).toBe(false);
        expect(isString(true)).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString(undefined)).toBe(false);
        expect(isString({})).toBe(false);
        expect(isString([])).toBe(false);
      });
    });

    describe("isNumber", () => {
      it("should return true for valid numbers", async () => {
        expect(isNumber(123)).toBe(true);
        expect(isNumber(123.45)).toBe(true);
        expect(isNumber(0)).toBe(true);
        expect(isNumber(-123)).toBe(true);
      });

      it("should return false for invalid numbers", async () => {
        expect(isNumber(NaN)).toBe(false);
        expect(isNumber(Infinity)).toBe(false);
        expect(isNumber(-Infinity)).toBe(false);
        expect(isNumber("123")).toBe(false);
        expect(isNumber(null)).toBe(false);
        expect(isNumber(undefined)).toBe(false);
      });
    });

    describe("isBoolean", () => {
      it("should return true for booleans", async () => {
        expect(isBoolean(true)).toBe(true);
        expect(isBoolean(false)).toBe(true);
      });

      it("should return false for non-booleans", async () => {
        expect(isBoolean("true")).toBe(false);
        expect(isBoolean(1)).toBe(false);
        expect(isBoolean(0)).toBe(false);
        expect(isBoolean(null)).toBe(false);
        expect(isBoolean(undefined)).toBe(false);
      });
    });

    describe("isArray", () => {
      it("should return true for arrays", async () => {
        expect(isArray([])).toBe(true);
        expect(isArray([1, 2, 3])).toBe(true);
        expect(isArray([])).toBe(true);
      });

      it("should return false for non-arrays", async () => {
        expect(isArray({})).toBe(false);
        expect(isArray("array")).toBe(false);
        expect(isArray(null)).toBe(false);
        expect(isArray(undefined)).toBe(false);
      });
    });

    describe("isObject", () => {
      it("should return true for objects", async () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ key: "value" })).toBe(true);
        expect(isObject(new Object())).toBe(true);
      });

      it("should return false for arrays and other types", async () => {
        expect(isObject([])).toBe(false);
        expect(isObject(null)).toBe(false);
        expect(isObject("object")).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject(undefined)).toBe(false);
      });
    });

    describe("isDate", () => {
      it("should return true for valid dates", async () => {
        expect(isDate(new Date())).toBe(true);
        expect(isDate(new Date("2023-01-01"))).toBe(true);
        expect(isDate(new Date(0))).toBe(true);
      });

      it("should return false for invalid dates", async () => {
        expect(isDate(new Date("invalid"))).toBe(false);
        expect(isDate("2023-01-01")).toBe(false);
        expect(isDate(1640995200000)).toBe(false);
        expect(isDate(null)).toBe(false);
        expect(isDate(undefined)).toBe(false);
      });
    });

    describe("isFile", () => {
      it("should return true for File objects", async () => {
        const file = new File(["content"], "test.txt", { type: "text/plain" });
        expect(isFile(file)).toBe(true);
      });

      it("should return false for non-File objects", async () => {
        expect(isFile({})).toBe(false);
        expect(isFile("file")).toBe(false);
        expect(isFile(null)).toBe(false);
        expect(isFile(undefined)).toBe(false);
      });
    });

    describe("isDateString", () => {
      it("should return true for valid date strings", async () => {
        expect(isDateString("2023-01-01", "yyyy-MM-dd")).toBe(true);
        expect(isDateString("01/01/2023", "MM/dd/yyyy")).toBe(true);
        expect(isDateString("2023-12-25T10:30:00", "yyyy-MM-dd'T'HH:mm:ss")).toBe(true);
      });

      it("should return false for invalid date strings", async () => {
        expect(isDateString("invalid-date", "yyyy-MM-dd")).toBe(false);
        expect(isDateString("2023-01-01", "MM/dd/yyyy")).toBe(false);
        expect(isDateString("13/32/2023", "MM/dd/yyyy")).toBe(false);
        expect(isDateString(123, "yyyy-MM-dd")).toBe(false);
        expect(isDateString(null, "yyyy-MM-dd")).toBe(false);
      });
    });
  });

  describe("isValueMasked", () => {
    it("should return true for masked private values", async () => {
      const schema = string().setPrivate(true);
      const maskedValue = mask();

      expect(isValueMasked(schema, maskedValue)).toBe(true);
    });

    it("should return false for plain private values", async () => {
      const schema = string().setPrivate(true);
      const plainValue = plain("secret");

      expect(isValueMasked(schema, plainValue)).toBe(false);
    });

    it("should return false for non-private schemas", async () => {
      const schema = string().setPrivate(false);
      const value = "regular value";

      expect(isValueMasked(schema, value)).toBe(false);
    });
  });

  describe("null value support", () => {
    describe("null values treated as undefined", () => {
      it("should handle null values for optional string fields", async () => {
        const schema = string().optional();
        const result = await validate(schema, undefined, null);

        expect(result).toEqual({
          success: true,
          values: undefined,
        });
      });

      it("should handle null values for optional number fields", async () => {
        const schema = number().optional();
        const result = await validate(schema, undefined, null);

        expect(result).toEqual({
          success: true,
          values: undefined,
        });
      });

      it("should fail when null value provided for required field", async () => {
        const schema = string().setRequired(true);
        const result = await validate(schema, undefined, null);

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: ErrorCode.REQRUIED,
              path: "$",
            }),
          ],
        });
      });

      it("should skip type validation for null values", async () => {
        const schema = string().optional();
        const result = await validate(schema, undefined, null);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.values).toBe(undefined);
        }
      });

      it("should skip rule validation for null values", async () => {
        const schema = string().optional().min(5);
        const result = await validate(schema, undefined, null);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.values).toBe(undefined);
        }
      });
    });

    describe("null values in objects", () => {
      it("should handle null values in object fields", async () => {
        const schema = object({
          name: string().optional(),
          age: number().optional(),
        });
        const result = await validate(schema, undefined, {
          name: null,
          age: null,
        });

        expect(result).toEqual({
          success: true,
          values: { name: undefined, age: undefined },
        });
      });

      it("should handle null current values in object validation", async () => {
        const schema = object({
          name: string().setRequired(true),
        });
        const result = await validate(schema, undefined, { name: "John" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.values).toEqual({ name: "John" });
        }
      });

      it("should validate nested objects with null values", async () => {
        const schema = object({
          user: object({
            name: string().optional(),
            email: string().setRequired(true),
          }),
        });

        const result = await validate(schema, undefined, {
          user: { name: null, email: "john@example.com" },
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.values).toEqual({
            user: { name: undefined, email: "john@example.com" },
          });
        }
      });
    });

    describe("null values in arrays", () => {
      it("should handle null current values in array validation", async () => {
        const schema = array(string());
        const result = await validate(schema, undefined, ["hello", "world"]);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.values).toEqual(["hello", "world"]);
        }
      });

      it("should handle null elements in arrays with optional items", async () => {
        const schema = array(string().optional());
        const result = await validate(schema, undefined, ["hello", null, "world"]);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.values).toEqual(["hello", undefined, "world"]);
        }
      });

      it("should fail for null elements in arrays with required items", async () => {
        const schema = array(string().setRequired(true));
        const result = await validate(schema, undefined, ["hello", null, "world"]);

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: ErrorCode.REQRUIED,
              path: "$.[1]",
            }),
          ],
        });
      });
    });

    describe("null values with private fields", () => {
      it("should handle null values for optional private fields by treating as plain null", async () => {
        const schema = string().setPrivate(true).optional();
        const result = await validate(schema, undefined, plain(undefined));

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.values).toBe(undefined);
        }
      });

      it("should fail when null provided for required private field", async () => {
        const schema = string().setPrivate(true).setRequired(true);
        const result = await validate(schema, undefined, plain(undefined));

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: ErrorCode.REQRUIED,
              path: "$",
            }),
          ],
        });
      });
    });

    describe("null values with included/excluded fields", () => {
      it("should succeed when null provided for non-included optional field", async () => {
        const schema = string().setIncluded(false).optional();
        const result = await validate(schema, undefined, null);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.values).toBe(undefined);
        }
      });

      it("should strip null values when stripNotIncludedValues is true", async () => {
        const schema = string().setIncluded(false).optional();
        const result = await validate(schema, undefined, null, {
          stripNotIncludedValues: true,
        });

        expect(result).toEqual({
          success: true,
          values: undefined,
        });
      });
    });

    describe("null values with mutability", () => {
      it("should pass when changing from undefined to null in non-mutable field", async () => {
        const schema = string().setMutable(false).optional();
        const result = await validate(schema, undefined, null);

        expect(result.success).toBe(true);
      });

      it("should fail when changing from value to null in non-mutable field", async () => {
        const schema = string().setMutable(false).optional();
        const result = await validate(schema, "original", null);

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: ErrorCode.IMMUTABLE,
            }),
          ],
        });
      });
    });

    describe("mixed null and undefined scenarios", () => {
      it("should handle mixed null and undefined in object fields", async () => {
        const schema = object({
          nullField: string().optional(),
          undefinedField: string().optional(),
          valueField: string().optional(),
        });
        const result = await validate(schema, undefined, {
          nullField: null,
          undefinedField: undefined,
          valueField: "value",
        });

        expect(result).toEqual({
          success: true,
          values: {
            nullField: undefined,
            undefinedField: undefined,
            valueField: "value",
          },
        });
      });

      it("should handle complex nested scenarios with null values", async () => {
        const schema = object({
          user: object({
            profile: object({
              name: string().optional(),
              bio: string().optional(),
            }),
            settings: array(
              object({
                key: string().setRequired(true),
                value: string().optional(),
              })
            ),
          }),
        });

        const result = await validate(schema, undefined, {
          user: {
            profile: {
              name: "John",
              bio: null,
            },
            settings: [
              { key: "theme", value: "dark" },
              { key: "notifications", value: null },
            ],
          },
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.values).toEqual({
            user: {
              profile: {
                name: "John",
                bio: undefined,
              },
              settings: [
                { key: "theme", value: "dark" },
                { key: "notifications", value: undefined },
              ],
            },
          });
        }
      });
    });
  });

  describe("error handling", () => {
    it("should handle edge cases with date validation", async () => {
      const schema = date();

      // Test with various invalid date scenarios
      expect((await validate(schema, undefined, "not-a-date")).success).toBe(false);
      expect((await validate(schema, undefined, 123)).success).toBe(false);
      expect((await validate(schema, undefined, {})).success).toBe(false);
      expect((await validate(schema, undefined, [])).success).toBe(false);
    });

    it("should handle Date object mutations correctly", async () => {
      const schema = date().setMutable(false);
      const originalDate = new Date("2023-01-01");
      const newDate = new Date("2023-01-02");

      const result = await validate(schema, originalDate, newDate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe(ErrorCode.IMMUTABLE);
      }
    });
  });
});
