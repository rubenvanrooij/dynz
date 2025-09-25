import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mask, plain } from "./private";
import { array, boolean, date, dateString, file, number, object, options, string } from "./schemas";
import {
  after,
  before,
  custom,
  email,
  equals,
  isNumeric,
  max,
  maxDate,
  maxLength,
  maxPrecision,
  mimeType,
  min,
  minDate,
  minLength,
  oneOf,
  regex,
} from "./shared-rules";
import { type CustomRuleMap, ErrorCode, SchemaType } from "./types";
import {
  isArray,
  isBoolean,
  isDate,
  isDateString,
  isFile,
  isNumber,
  isObject,
  isString,
  isValueMasked,
  validate,
  validateType,
} from "./validate";

describe("validate", () => {
  beforeEach(() => {
    vi.stubEnv("TZ", "UTC");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("basic validation", () => {
    it("should validate a simple string schema", () => {
      const schema = string();
      const result = validate(schema, undefined, "hello");

      expect(result).toEqual({
        success: true,
        values: "hello",
      });
    });

    it("should validate a simple number schema", () => {
      const schema = number();
      const result = validate(schema, undefined, 42);

      expect(result).toEqual({
        success: true,
        values: 42,
      });
    });

    it("should validate an object schema", () => {
      const schema = object({
        fields: {
          name: string(),
          age: number(),
        },
      });
      const result = validate(schema, undefined, { name: "John", age: 30 });

      expect(result).toEqual({
        success: true,
        values: { name: "John", age: 30 },
      });
    });
  });

  describe("required validation", () => {
    it("should fail when required field is missing", () => {
      const schema = string({ required: true });
      const result = validate(schema, undefined, undefined);

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

    it("should pass when required field is present", () => {
      const schema = string({ required: true });
      const result = validate(schema, undefined, "hello");

      expect(result.success).toBe(true);
    });

    it("should pass when optional field is missing", () => {
      const schema = string({ required: false });
      const result = validate(schema, undefined, undefined);

      expect(result.success).toBe(true);
    });
  });

  describe("type validation", () => {
    it("should fail when string value is not a string", () => {
      const schema = string();
      const result = validate(schema, undefined, 42);

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

    it("should fail when number value is not a number", () => {
      const schema = number();
      const result = validate(schema, undefined, "not a number");

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

    it("should fail when object value is not an object", () => {
      const schema = object({ fields: {} });
      const result = validate(schema, undefined, "not an object");

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

    it("should fail when array value is not an array", () => {
      const schema = array({ schema: string() });
      const result = validate(schema, undefined, "not an array");

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

  describe("date validation", () => {
    it("should validate a valid date object", () => {
      const schema = date();
      const testDate = new Date("2023-12-25");
      const result = validate(schema, undefined, testDate);

      expect(result).toEqual({
        success: true,
        values: testDate,
      });
    });

    it("should fail when date value is not a date", () => {
      const schema = date();
      const result = validate(schema, undefined, "not a date");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.DATE,
          }),
        ],
      });
    });

    it("should fail when date value is invalid", () => {
      const schema = date();
      const result = validate(schema, undefined, new Date("invalid"));

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.DATE,
          }),
        ],
      });
    });

    it("should coerce string to date when coerce is enabled", () => {
      const schema = date({ coerce: true });
      const result = validate(schema, undefined, "2023-12-25T10:00:00Z");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values).toBeInstanceOf(Date);
        expect((result.values as Date).getFullYear()).toBe(2023);
        expect((result.values as Date).getMonth()).toBe(11); // December is month 11
        expect((result.values as Date).getDate()).toBe(25);
      }
    });

    it("should coerce number to date when coerce is enabled", () => {
      const schema = date({ coerce: true });
      const timestamp = new Date("2023-01-01").getTime();
      const result = validate(schema, undefined, timestamp);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.values).toBeInstanceOf(Date);
        expect((result.values as Date).getTime()).toBe(timestamp);
      }
    });

    it("should fail when coerced value is invalid", () => {
      const schema = date({ coerce: true });
      const result = validate(schema, undefined, "invalid date string");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.DATE,
          }),
        ],
      });
    });

    it("should validate date with equals rule", () => {
      const targetDate = new Date("2023-01-01");
      const schema = date({ rules: [equals(targetDate)] });

      const validResult = validate(schema, undefined, new Date("2023-01-01"));
      expect(validResult.success).toBe(true);

      const invalidResult = validate(schema, undefined, new Date("2023-01-02"));
      expect(invalidResult).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: "equals",
            equals: targetDate,
          }),
        ],
      });
    });

    it("should validate date with min rule", () => {
      const minimumDate = new Date("2023-01-01");
      const schema = date({ rules: [minDate(minimumDate)] });

      const validResult = validate(schema, undefined, new Date("2023-06-15"));
      expect(validResult.success).toBe(true);

      const invalidResult = validate(schema, undefined, new Date("2022-12-31"));
      expect(invalidResult).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: "min_date",
            min: minimumDate,
          }),
        ],
      });
    });

    it("should validate date with max rule", () => {
      const maximumDate = new Date("2023-12-31");
      const schema = date({ rules: [maxDate(maximumDate)] });

      const validResult = validate(schema, undefined, new Date("2023-06-15"));
      expect(validResult.success).toBe(true);

      const invalidResult = validate(schema, undefined, new Date("2024-01-01"));
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.errors[0].code).toBe("max_date");
      }
    });

    it("should validate date with after rule", () => {
      const afterDate = new Date("2023-01-01");
      const schema = date({ rules: [after(afterDate)] });

      const validResult = validate(schema, undefined, new Date("2023-06-15"));
      expect(validResult.success).toBe(true);

      const invalidResult = validate(schema, undefined, new Date("2022-12-31"));
      expect(invalidResult).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: "after",
            after: afterDate,
          }),
        ],
      });
    });

    it("should validate date with before rule", () => {
      const beforeDate = new Date("2023-12-31");
      const schema = date({ rules: [before(beforeDate)] });

      const validResult = validate(schema, undefined, new Date("2023-06-15"));
      expect(validResult.success).toBe(true);

      const invalidResult = validate(schema, undefined, new Date("2024-01-01"));
      expect(invalidResult).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: "before",
            before: beforeDate,
          }),
        ],
      });
    });

    it("should validate date with multiple rules", () => {
      const minimumDate = new Date("2023-01-01");
      const maximumDate = new Date("2023-12-31");
      const schema = date({ rules: [minDate(minimumDate), maxDate(maximumDate)] });

      const validResult = validate(schema, undefined, new Date("2023-06-15"));
      expect(validResult.success).toBe(true);

      const tooEarlyResult = validate(schema, undefined, new Date("2022-12-31"));
      expect(tooEarlyResult.success).toBe(false);

      const tooLateResult = validate(schema, undefined, new Date("2024-01-01"));
      expect(tooLateResult.success).toBe(false);
    });
  });

  describe("date string validation", () => {
    it("should validate a valid date string", () => {
      const schema = dateString();
      const result = validate(schema, undefined, "2023-12-25");

      expect(result).toEqual({
        success: true,
        values: "2023-12-25",
      });
    });

    it("should fail when date string format is invalid", () => {
      const schema = dateString();
      const result = validate(schema, undefined, "invalid-date");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.DATE_STRING,
          }),
        ],
      });
    });

    it("should validate custom date format", () => {
      const schema = dateString({ format: "MM/dd/yyyy" });
      const result = validate(schema, undefined, "12/25/2023");

      expect(result).toEqual({
        success: true,
        values: "12/25/2023",
      });
    });
  });

  describe("included validation", () => {
    it("should fail when value is provided for non-included schema", () => {
      const schema = string({ included: false });
      const result = validate(schema, undefined, "hello");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.INCLUDED,
            path: "$",
          }),
        ],
      });
    });

    it("should pass when no value is provided for non-included schema", () => {
      const schema = string({ included: false });
      const result = validate(schema, undefined, undefined);

      expect(result).toEqual({
        success: true,
        values: undefined,
      });
    });
  });

  describe("mutability validation", () => {
    it("should fail when immutable field is changed", () => {
      const schema = string({ mutable: false });
      // biome-ignore lint/suspicious/noExplicitAny: unit test
      const result = validate(schema, "original" as any, "changed");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.IMMUTABLE,
            path: "$",
          }),
        ],
      });
    });

    it("should pass when immutable field is not changed", () => {
      const schema = string({ mutable: false });
      // biome-ignore lint/suspicious/noExplicitAny: unit test
      const result = validate(schema, "same" as any, "same");

      expect(result.success).toBe(true);
    });

    it("should pass when mutable field is changed", () => {
      const schema = string({ mutable: true });
      // biome-ignore lint/suspicious/noExplicitAny: unit test
      const result = validate(schema, "original" as any, "changed");

      expect(result.success).toBe(true);
    });
  });

  describe("nested object validation", () => {
    it("should validate nested object fields", () => {
      const schema = object({
        fields: {
          user: object({
            fields: {
              name: string(),
              age: number(),
            },
          }),
        },
      });

      const result = validate(schema, undefined, {
        user: { name: "John", age: 30 },
      });

      expect(result.success).toBe(true);
    });

    it("should fail validation for nested object with invalid field", () => {
      const schema = object({
        fields: {
          user: object({
            fields: {
              name: string(),
              age: number(),
            },
          }),
        },
      });

      const result = validate(schema, undefined, {
        user: { name: "John", age: "not a number" },
      });

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            path: "$.user.age",
          }),
        ],
      });
    });
  });

  describe("array validation", () => {
    it("should validate array of strings", () => {
      const schema = array({ schema: string() });
      const result = validate(schema, undefined, ["hello", "world"]);

      expect(result).toEqual({
        success: true,
        values: ["hello", "world"],
      });
    });

    it("should fail validation for array with invalid item", () => {
      const schema = array({ schema: string() });
      const result = validate(schema, undefined, ["hello", 42]);

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            path: "$.[1]",
          }),
        ],
      });
    });
  });

  describe("validation rules", () => {
    describe("min rule", () => {
      it("should pass when string length meets minimum", () => {
        const schema = string({ rules: [minLength(3)] });
        const result = validate(schema, undefined, "hello");

        expect(result.success).toBe(true);
      });

      it("should fail when string length is below minimum", () => {
        const schema = string({ rules: [minLength(5)] });
        const result = validate(schema, undefined, "hi");

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "min_length",
              min: 5,
            }),
          ],
        });
      });

      it("should pass when number meets minimum", () => {
        const schema = number({ rules: [min(10)] });
        const result = validate(schema, undefined, 15);

        expect(result.success).toBe(true);
      });

      it("should fail when number is below minimum", () => {
        const schema = number({ rules: [min(10)] });
        const result = validate(schema, undefined, 5);

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "min",
              min: 10,
            }),
          ],
        });
      });
    });

    describe("max rule", () => {
      it("should pass when string length is within maximum", () => {
        const schema = string({ rules: [maxLength(10)] });
        const result = validate(schema, undefined, "hello");

        expect(result.success).toBe(true);
      });

      it("should fail when string length exceeds maximum", () => {
        const schema = string({ rules: [maxLength(3)] });
        const result = validate(schema, undefined, "hello");

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "max_length",
              max: 3,
            }),
          ],
        });
      });

      it("should pass when number is within maximum", () => {
        const schema = number({ rules: [max(100)] });
        const result = validate(schema, undefined, 50);

        expect(result.success).toBe(true);
      });

      it("should fail when number exceeds maximum", () => {
        const schema = number({ rules: [max(10)] });
        const result = validate(schema, undefined, 15);

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "max",
              max: 10,
            }),
          ],
        });
      });
    });

    describe("equals rule", () => {
      it("should pass when value equals expected", () => {
        const schema = string({ rules: [equals("hello")] });
        const result = validate(schema, undefined, "hello");

        expect(result.success).toBe(true);
      });

      it("should fail when value does not equal expected", () => {
        const schema = string({ rules: [equals("hello")] });
        const result = validate(schema, undefined, "world");

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "equals",
              equals: "hello",
            }),
          ],
        });
      });

      it("should pass when number equals expected", () => {
        const schema = number({ rules: [equals(42)] });
        const result = validate(schema, undefined, 42);

        expect(result.success).toBe(true);
      });

      it("should fail when number does not equal expected", () => {
        const schema = number({ rules: [equals(42)] });
        const result = validate(schema, undefined, 24);

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "equals",
              equals: 42,
            }),
          ],
        });
      });
    });

    describe("regex rule", () => {
      it("should pass when string matches regex", () => {
        const schema = string({ rules: [regex("^[a-z]+$")] });
        const result = validate(schema, undefined, "hello");

        expect(result.success).toBe(true);
      });

      it("should fail when string does not match regex", () => {
        const schema = string({ rules: [regex("^[a-z]+$")] });
        const result = validate(schema, undefined, "Hello123");

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "regex",
              regex: "^[a-z]+$",
            }),
          ],
        });
      });

      it("should validate email format", () => {
        const emailRegex = "^[^@]+@[^@]+\\.[^@]+$";
        const schema = string({ rules: [regex(emailRegex)] });

        const validResult = validate(schema, undefined, "test@example.com");
        expect(validResult.success).toBe(true);

        const invalidResult = validate(schema, undefined, "invalid-email");
        expect(invalidResult.success).toBe(false);
      });
    });

    describe("isNumeric rule", () => {
      it("should pass when string is numeric", () => {
        const schema = string({ rules: [isNumeric()] });
        const result = validate(schema, undefined, "123");

        expect(result.success).toBe(true);
      });

      it("should pass when string is decimal", () => {
        const schema = string({ rules: [isNumeric()] });
        const result = validate(schema, undefined, "123.45");

        expect(result.success).toBe(true);
      });

      it("should fail when string is not numeric", () => {
        const schema = string({ rules: [isNumeric()] });
        const result = validate(schema, undefined, "abc123");

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "is_numeric",
            }),
          ],
        });
      });
    });

    describe("combined rules", () => {
      it("should validate multiple rules on same field", () => {
        const schema = string({ rules: [minLength(3), maxLength(10), regex("^[a-z]+$")] });
        const result = validate(schema, undefined, "hello");

        expect(result.success).toBe(true);
      });

      it("should fail when one of multiple rules fails", () => {
        const schema = string({ rules: [minLength(3), maxLength(10), regex("^[a-z]+$")] });
        const result = validate(schema, undefined, "Hello");

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "regex",
            }),
          ],
        });
      });
    });
  });

  describe("boolean validation", () => {
    it("should validate boolean true", () => {
      const schema = boolean();
      const result = validate(schema, undefined, true);

      expect(result).toEqual({
        success: true,
        values: true,
      });
    });

    it("should validate boolean false", () => {
      const schema = boolean();
      const result = validate(schema, undefined, false);

      expect(result).toEqual({
        success: true,
        values: false,
      });
    });

    it("should fail when boolean value is not a boolean", () => {
      const schema = boolean();
      const result = validate(schema, undefined, "not a boolean");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.BOOLEAN,
          }),
        ],
      });
    });
  });

  describe("file validation", () => {
    it("should validate file value", () => {
      const schema = file();
      const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
      const result = validate(schema, undefined, mockFile);

      expect(result).toEqual({
        success: true,
        values: mockFile,
      });
    });

    it("should fail when file value is not a file", () => {
      const schema = file();
      const result = validate(schema, undefined, "not a file");

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.TYPE,
            expectedType: SchemaType.FILE,
          }),
        ],
      });
    });
  });

  describe("options validation", () => {
    it("should validate string option value", () => {
      const schema = options({ options: ["apple", "banana", "orange"] });
      const result = validate(schema, undefined, "apple");

      expect(result).toEqual({
        success: true,
        values: "apple",
      });
    });

    it("should validate number option value", () => {
      const schema = options({ options: [1, 2, 3] });
      const result = validate(schema, undefined, 2);

      expect(result).toEqual({
        success: true,
        values: 2,
      });
    });
  });

  describe("private field validation", () => {
    it("should handle plain private values", () => {
      const schema = string({ private: true });
      const plainValue = plain("secret");
      const result = validate(schema, undefined, plainValue);

      expect(result).toEqual({
        success: true,
        values: "secret",
      });
    });

    it("should handle masked private values", () => {
      const schema = string({ private: true });
      const maskedValue = mask("secret");
      const result = validate(schema, undefined, maskedValue);

      expect(result).toEqual({
        success: true,
        values: maskedValue,
      });
    });

    it("should detect value changes in private fields", () => {
      const schema = string({ private: true, mutable: false });
      const currentValue = plain("original");
      const newValue = plain("changed");
      // biome-ignore lint/suspicious/noExplicitAny: unit test
      const result = validate(schema, currentValue as any, newValue);

      expect(result).toEqual({
        success: false,
        errors: [
          expect.objectContaining({
            code: ErrorCode.IMMUTABLE,
          }),
        ],
      });
    });

    it("should pass when private values are the same", () => {
      const schema = string({ private: true, mutable: false });
      const currentValue = plain("same");
      const newValue = plain("same");
      // biome-ignore lint/suspicious/noExplicitAny: unit test
      const result = validate(schema, currentValue as any, newValue);

      expect(result.success).toBe(true);
    });
  });

  describe("stripNotIncludedValues option", () => {
    it("should strip values when schema is not included", () => {
      const schema = string({ included: false });
      const result = validate(schema, undefined, "hello", { stripNotIncludedValues: true });

      expect(result).toEqual({
        success: true,
        values: undefined,
      });
    });
  });

  describe("coercion", () => {
    it("should coerce string to number when coerce is true", () => {
      const schema = number({ coerce: true });
      const result = validate(schema, undefined, "42");

      expect(result).toEqual({
        success: true,
        values: 42,
      });
    });
  });

  describe("advanced rules", () => {
    describe("maxPrecision rule", () => {
      it("should pass when number precision is within limit", () => {
        const schema = number({ rules: [maxPrecision(2)] });
        const result = validate(schema, undefined, 123.45);

        expect(result.success).toBe(true);
      });

      it("should fail when number precision exceeds limit", () => {
        const schema = number({ rules: [maxPrecision(1)] });
        const result = validate(schema, undefined, 123.456);
        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "max_precision",
              maxPrecision: 1,
            }),
          ],
        });
      });
    });

    describe("custom rule", () => {
      it("should validate custom rule", () => {
        const customRules: CustomRuleMap = {
          isEven: ({ value }: { value: unknown }) => typeof value === "number" && value % 2 === 0,
        };

        const schema = number({ rules: [custom("isEven", {})] });
        const result = validate(schema, undefined, 4, { customRules });

        expect(result.success).toBe(true);
      });

      it("should fail custom rule validation", () => {
        const customRules: CustomRuleMap = {
          isEven: ({ value }: { value: unknown }) => typeof value === "number" && value % 2 === 0,
        };

        const schema = number({ rules: [custom("isEven", {})] });
        const result = validate(schema, undefined, 3, { customRules });

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "custom",
              name: "isEven",
            }),
          ],
        });
      });

      it("should throw error when custom rule is not defined", () => {
        const schema = number({ rules: [custom("undefinedRule", {})] });

        expect(() => {
          validate(schema, undefined, 42, { customRules: {} });
        }).toThrow('Custom rule "undefinedRule" is not defined in the custom rules map.');
      });
    });

    describe("email rule", () => {
      it("should pass valid email", () => {
        const schema = string({ rules: [email()] });
        const result = validate(schema, undefined, "test@example.com");

        expect(result.success).toBe(true);
      });

      it("should fail invalid email", () => {
        const schema = string({ rules: [email()] });
        const result = validate(schema, undefined, "invalid-email");

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "email",
            }),
          ],
        });
      });
    });

    describe("oneOf rule", () => {
      it("should pass when value is in oneOf list", () => {
        const schema = string({ rules: [oneOf(["red", "green", "blue"])] });
        const result = validate(schema, undefined, "red");

        expect(result.success).toBe(true);
      });

      it("should fail when value is not in oneOf list", () => {
        const schema = string({ rules: [oneOf(["red", "green", "blue"])] });
        const result = validate(schema, undefined, "yellow");

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "one_of",
              values: ["red", "green", "blue"],
            }),
          ],
        });
      });
    });

    describe("mimeType rule", () => {
      it("should pass when file mime type matches", () => {
        const schema = file({ rules: [mimeType("text/plain")] });
        const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
        const result = validate(schema, undefined, mockFile);

        expect(result.success).toBe(true);
      });

      it("should fail when file mime type does not match", () => {
        const schema = file({ rules: [mimeType("image/jpeg")] });
        const mockFile = new File(["content"], "test.txt", { type: "text/plain" });
        const result = validate(schema, undefined, mockFile);

        expect(result).toEqual({
          success: false,
          errors: [
            expect.objectContaining({
              code: "mime_type",
              mimeType: "text/plain",
            }),
          ],
        });
      });

      it("should handle array of mime types", () => {
        const schema = file({ rules: [mimeType(["text/plain", "text/csv"])] });
        const mockFile = new File(["content"], "test.csv", { type: "text/csv" });
        const result = validate(schema, undefined, mockFile);

        expect(result.success).toBe(true);
      });
    });

    // describe.skip("date string rules", () => {
    //   describe("before rule", () => {
    //     it("should pass when date is before specified date", () => {
    //       const schema = dateString({ rules: [before(new Date("2024-01-01"))] });
    //       const result = validate(schema, undefined, "2023-12-25");

    //       expect(result.success).toBe(true);
    //     });

    //     it("should fail when date is after specified date", () => {
    //       const schema = dateString({ rules: [before("2023-01-01")] });
    //       const result = validate(schema, undefined, "2023-12-25");

    //       expect(result).toEqual({
    //         success: false,
    //         errors: [
    //           expect.objectContaining({
    //             code: ErrorCode.BEFORE,
    //             before: "2023-01-01",
    //           }),
    //         ],
    //       });
    //     });
    //   });

    //   describe("after rule", () => {
    //     it("should pass when date is after specified date", () => {
    //       const schema = dateString({ rules: [after("2023-01-01")] });
    //       const result = validate(schema, undefined, "2023-12-25");

    //       expect(result.success).toBe(true);
    //     });

    //     it("should fail when date is before specified date", () => {
    //       const schema = dateString({ rules: [after("2024-01-01")] });
    //       const result = validate(schema, undefined, "2023-12-25");

    //       expect(result).toEqual({
    //         success: false,
    //         errors: [
    //           expect.objectContaining({
    //             code: ErrorCode.AFTER,
    //             after: "2024-01-01",
    //           }),
    //         ],
    //       });
    //     });
    //   });

    //   // describe.skip("min/max rules for date strings", () => {
    //   //   it("should pass when date is after minimum date", () => {
    //   //     const schema = dateString({ rules: [min("2023-01-01")] });
    //   //     const result = validate(schema, undefined, "2023-12-25");

    //   //     expect(result.success).toBe(true);
    //   //   });

    //   //   it("should fail when date is before minimum date", () => {
    //   //     const schema = dateString({ rules: [min("2024-01-01")] });
    //   //     const result = validate(schema, undefined, "2023-12-25");

    //   //     expect(result.success).toBe(false);
    //   //     if (!result.success) {
    //   //       expect(result.errors[0].code).toBe('min');
    //   //     }
    //   //   });

    //   //   it("should pass when date is before maximum date", () => {
    //   //     const schema = dateString({ rules: [max("2024-01-01")] });
    //   //     const result = validate(schema, undefined, "2023-12-25");

    //   //     expect(result.success).toBe(true);
    //   //   });

    //   //   it("should fail when date is after maximum date", () => {
    //   //     const schema = dateString({ rules: [max("2023-01-01")] });
    //   //     const result = validate(schema, undefined, "2023-12-25");

    //   //     expect(result).toEqual({
    //   //       success: false,
    //   //       errors: [
    //   //         expect.objectContaining({
    //   //           code: 'max',
    //   //           max: new Date("2023-01-01T00:00:00.000Z"),
    //   //         }),
    //   //       ],
    //   //     });
    //   //   });
    //   // });
    // });
  });

  describe("type validation functions", () => {
    describe("validateType", () => {
      it("should validate string type", () => {
        expect(validateType(SchemaType.STRING, "hello")).toBe(true);
        expect(validateType(SchemaType.STRING, 123)).toBe(false);
      });

      it("should validate number type", () => {
        expect(validateType(SchemaType.NUMBER, 42)).toBe(true);
        expect(validateType(SchemaType.NUMBER, "hello")).toBe(false);
      });

      it("should validate boolean type", () => {
        expect(validateType(SchemaType.BOOLEAN, true)).toBe(true);
        expect(validateType(SchemaType.BOOLEAN, "hello")).toBe(false);
      });

      it("should validate object type", () => {
        expect(validateType(SchemaType.OBJECT, {})).toBe(true);
        expect(validateType(SchemaType.OBJECT, [])).toBe(false);
      });

      it("should validate array type", () => {
        expect(validateType(SchemaType.ARRAY, [])).toBe(true);
        expect(validateType(SchemaType.ARRAY, {})).toBe(false);
      });

      it("should validate file type", () => {
        const mockFile = new File(["content"], "test.txt");
        expect(validateType(SchemaType.FILE, mockFile)).toBe(true);
        expect(validateType(SchemaType.FILE, "not a file")).toBe(false);
      });

      it("should validate options type", () => {
        expect(validateType(SchemaType.OPTIONS, "string")).toBe(true);
        expect(validateType(SchemaType.OPTIONS, 42)).toBe(true);
        expect(validateType(SchemaType.OPTIONS, true)).toBe(true);
        expect(validateType(SchemaType.OPTIONS, {})).toBe(false);
      });

      it("should validate date type", () => {
        expect(validateType(SchemaType.DATE, new Date())).toBe(true);
        expect(validateType(SchemaType.DATE, new Date("2023-12-25"))).toBe(true);
        expect(validateType(SchemaType.DATE, "2023-12-25")).toBe(false);
        expect(validateType(SchemaType.DATE, new Date("invalid"))).toBe(false);
      });

      it("should validate date string type with format", () => {
        expect(validateType(SchemaType.DATE_STRING, "2023-12-25", "yyyy-MM-dd")).toBe(true);
        expect(validateType(SchemaType.DATE_STRING, "invalid-date", "yyyy-MM-dd")).toBe(false);
      });

      it("should throw error for date string without format", () => {
        expect(() => {
          validateType(SchemaType.DATE_STRING, "2023-12-25");
        }).toThrow("No date format supplied for date string type");
      });
    });

    describe("type checking functions", () => {
      describe("isString", () => {
        it("should return true for strings", () => {
          expect(isString("hello")).toBe(true);
          expect(isString("")).toBe(true);
        });

        it("should return false for non-strings", () => {
          expect(isString(123)).toBe(false);
          expect(isString(true)).toBe(false);
          expect(isString({})).toBe(false);
        });
      });

      describe("isNumber", () => {
        it("should return true for valid numbers", () => {
          expect(isNumber(42)).toBe(true);
          expect(isNumber(0)).toBe(true);
          expect(isNumber(-5.5)).toBe(true);
        });

        it("should return false for invalid numbers", () => {
          expect(isNumber(NaN)).toBe(false);
          expect(isNumber(Infinity)).toBe(false);
          expect(isNumber("123")).toBe(false);
        });
      });

      describe("isBoolean", () => {
        it("should return true for booleans", () => {
          expect(isBoolean(true)).toBe(true);
          expect(isBoolean(false)).toBe(true);
        });

        it("should return false for non-booleans", () => {
          expect(isBoolean(1)).toBe(false);
          expect(isBoolean("true")).toBe(false);
        });
      });

      describe("isArray", () => {
        it("should return true for arrays", () => {
          expect(isArray([])).toBe(true);
          expect(isArray([1, 2, 3])).toBe(true);
        });

        it("should return false for non-arrays", () => {
          expect(isArray({})).toBe(false);
          expect(isArray("hello")).toBe(false);
        });
      });

      describe("isObject", () => {
        it("should return true for objects", () => {
          expect(isObject({})).toBe(true);
          expect(isObject({ a: 1 })).toBe(true);
        });

        it("should return false for arrays and other types", () => {
          expect(isObject([])).toBe(false);
          expect(isObject("hello")).toBe(false);
          expect(isObject(null)).toBe(false);
        });
      });

      describe("isDate", () => {
        it("should return true for valid dates", () => {
          expect(isDate(new Date())).toBe(true);
          expect(isDate(new Date("2023-12-25"))).toBe(true);
        });

        it("should return false for invalid dates", () => {
          expect(isDate(new Date("invalid"))).toBe(false);
          expect(isDate("2023-12-25")).toBe(false);
        });
      });

      describe("isFile", () => {
        it("should return true for File objects", () => {
          const mockFile = new File(["content"], "test.txt");
          expect(isFile(mockFile)).toBe(true);
        });

        it("should return false for non-File objects", () => {
          expect(isFile("not a file")).toBe(false);
          expect(isFile({})).toBe(false);
        });
      });

      describe("isDateString", () => {
        it("should return true for valid date strings", () => {
          expect(isDateString("2023-12-25", "yyyy-MM-dd")).toBe(true);
          expect(isDateString("12/25/2023", "MM/dd/yyyy")).toBe(true);
        });

        it("should return false for invalid date strings", () => {
          expect(isDateString("invalid-date", "yyyy-MM-dd")).toBe(false);
          expect(isDateString(123, "yyyy-MM-dd")).toBe(false);
        });
      });
    });
  });

  describe("isValueMasked", () => {
    it("should return true for masked private values", () => {
      const schema = string({ private: true });
      const maskedValue = mask("secret");
      expect(isValueMasked(schema, maskedValue)).toBe(true);
    });

    it("should return false for plain private values", () => {
      const schema = string({ private: true });
      const plainValue = plain("secret");
      expect(isValueMasked(schema, plainValue)).toBe(false);
    });

    it("should return false for non-private schemas", () => {
      const schema = string();
      expect(isValueMasked(schema, "hello")).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle edge cases with date validation", () => {
      // Test null coercion
      const schema = date({ coerce: true });
      const nullResult = validate(schema, undefined, null);
      expect(nullResult.success).toBe(false);

      // Test undefined coercion with required false
      const optionalSchema = date({ coerce: true, required: false });
      const undefinedResult = validate(optionalSchema, undefined, undefined);
      expect(undefinedResult.success).toBe(true);
    });

    it("should handle Date object mutations correctly", () => {
      const schema = date({ mutable: false });
      const originalDate = new Date("2023-01-01");
      const sameDate = new Date("2023-01-01");
      const differentDate = new Date("2023-01-02");

      // For mutation tests, we need to pass a SchemaValues type as currentValues
      // Let's use a simpler test with strings
      // biome-ignore lint/suspicious/noExplicitAny: unit test
      const result1 = validate(schema, originalDate as any, sameDate);
      expect(result1.success).toBe(true);

      // biome-ignore lint/suspicious/noExplicitAny: unit test
      const result2 = validate(schema, originalDate as any, differentDate);
      expect(result2.success).toBe(false);
    });

    it("should handle min rule with undefined value", () => {
      // @ts-expect-error
      const schema = number({ rules: [{ type: "min", min: undefined }] });
      const result = validate(schema, undefined, 5);

      expect(result.success).toBe(true);
    });

    it("should throw error when max is not number or string", () => {
      // @ts-expect-error
      const schema = number({ rules: [{ type: "max", max: {} }] });

      expect(() => {
        validate(schema, undefined, 5);
      }).toThrow("Invalid type: object with [object Object] for schema type: number");
    });

    it("should throw error when min is not number or string", () => {
      // @ts-expect-error
      const schema = number({ rules: [{ type: "min", min: {} }] });

      expect(() => {
        validate(schema, undefined, 5);
      }).toThrow();
    });
  });
});
