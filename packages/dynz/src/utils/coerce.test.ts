import { describe, expect, it } from "vitest";
import { SchemaType } from "../types";
import { coerce } from "./coerce";

describe("coerce", () => {
  describe("when coerce is false or not set", () => {
    it("should return original value for string schema without coerce", () => {
      const schema = { type: SchemaType.STRING };
      const value = 123;
      const result = coerce(schema, value);

      expect(result).toBe(123);
    });

    it("should return original value when coerce is false", () => {
      const schema = { type: SchemaType.STRING, coerce: false };
      const value = 123;

      const result = coerce(schema, value);

      expect(result).toBe(123);
    });
  });

  describe("when value is null or undefined", () => {
    it("should return null when value is null", () => {
      const schema = { type: SchemaType.STRING, coerce: true };

      const result = coerce(schema, null);

      expect(result).toBe(null);
    });

    it("should return undefined when value is undefined", () => {
      const schema = { type: SchemaType.STRING, coerce: true };

      const result = coerce(schema, undefined);

      expect(result).toBe(undefined);
    });
  });

  describe("DATE schema coercion", () => {
    it("should coerce string to Date", () => {
      const schema = { type: SchemaType.DATE, coerce: true };
      const value = "2024-01-01";

      const result = coerce(schema, value);

      expect(result).toEqual(new Date("2024-01-01"));
    });

    it("should coerce number to Date", () => {
      const schema = { type: SchemaType.DATE, coerce: true };
      const value = 1640995200000; // 2022-01-01 00:00:00 UTC

      const result = coerce(schema, value);

      expect(result).toEqual(new Date(1640995200000));
    });

    it("should return original value if not string or number", () => {
      const schema = { type: SchemaType.DATE, coerce: true };
      const value = { custom: "object" };

      const result = coerce(schema, value);

      expect(result).toBe(value);
    });
  });

  describe("NUMBER schema coercion", () => {
    it("should coerce string to number", () => {
      const schema = { type: SchemaType.NUMBER, coerce: true };
      const value = "123.45";

      const result = coerce(schema, value);

      expect(result).toBe(123.45);
    });

    it("should coerce boolean to number", () => {
      const schema = { type: SchemaType.NUMBER, coerce: true };
      const trueValue = true;
      const falseValue = false;

      const trueResult = coerce(schema, trueValue);
      const falseResult = coerce(schema, falseValue);

      expect(trueResult).toBe(1);
      expect(falseResult).toBe(0);
    });

    it("should return original number value", () => {
      const schema = { type: SchemaType.NUMBER, coerce: true };
      const value = 42;

      const result = coerce(schema, value);

      expect(result).toBe(42);
    });

    it("should coerce invalid string to NaN", () => {
      const schema = { type: SchemaType.NUMBER, coerce: true };
      const value = "invalid";

      const result = coerce(schema, value);

      expect(result).toBeNaN();
    });
  });

  describe("BOOLEAN schema coercion", () => {
    it("should return original boolean value", () => {
      const schema = { type: SchemaType.BOOLEAN, coerce: true };

      const trueResult = coerce(schema, true);
      const falseResult = coerce(schema, false);

      expect(trueResult).toBe(true);
      expect(falseResult).toBe(false);
    });

    it("should coerce 'true' string to true", () => {
      const schema = { type: SchemaType.BOOLEAN, coerce: true };
      const value = "true";

      const result = coerce(schema, value);

      expect(result).toBe(true);
    });

    it("should coerce 'false' string to false", () => {
      const schema = { type: SchemaType.BOOLEAN, coerce: true };
      const value = "false";

      const result = coerce(schema, value);

      expect(result).toBe(false);
    });

    it("should coerce truthy values to true", () => {
      const schema = { type: SchemaType.BOOLEAN, coerce: true };

      expect(coerce(schema, 1)).toBe(true);
      expect(coerce(schema, "hello")).toBe(true);
      expect(coerce(schema, {})).toBe(true);
      expect(coerce(schema, [])).toBe(true);
    });

    it("should coerce falsy values to false", () => {
      const schema = { type: SchemaType.BOOLEAN, coerce: true };

      expect(coerce(schema, 0)).toBe(false);
      expect(coerce(schema, "")).toBe(false);
    });
  });

  describe("STRING schema coercion", () => {
    it("should coerce number to string", () => {
      const schema = { type: SchemaType.STRING, coerce: true };
      const value = 123;

      const result = coerce(schema, value);

      expect(result).toBe("123");
    });

    it("should coerce boolean to string", () => {
      const schema = { type: SchemaType.STRING, coerce: true };

      const trueResult = coerce(schema, true);
      const falseResult = coerce(schema, false);

      expect(trueResult).toBe("true");
      expect(falseResult).toBe("false");
    });

    it("should return original string value", () => {
      const schema = { type: SchemaType.STRING, coerce: true };
      const value = "hello";

      const result = coerce(schema, value);

      expect(result).toBe("hello");
    });

    it("should return original value if not number or boolean", () => {
      const schema = { type: SchemaType.STRING, coerce: true };
      const value = { custom: "object" };

      const result = coerce(schema, value);

      expect(result).toBe(value);
    });
  });

  describe("ARRAY schema coercion", () => {
    it("should coerce string to array", () => {
      const schema = {
        type: SchemaType.ARRAY,
        coerce: true,
        schema: { type: SchemaType.STRING },
      };
      const value = "hello";

      const result = coerce(schema, value);

      expect(result).toEqual(["h", "e", "l", "l", "o"]);
    });

    it("should coerce iterable to array", () => {
      const schema = {
        type: SchemaType.ARRAY,
        coerce: true,
        schema: { type: SchemaType.NUMBER },
      };
      const value = new Set([1, 2, 3]);

      const result = coerce(schema, value);

      expect(result).toEqual([1, 2, 3]);
    });

    it("should return original value if not iterable", () => {
      const schema = {
        type: SchemaType.ARRAY,
        coerce: true,
        schema: { type: SchemaType.STRING },
      };
      const value = 123;

      const result = coerce(schema, value);

      expect(result).toBe(value);
    });
  });

  describe("unknown schema type", () => {
    it("should return original value for unknown schema type", () => {
      const schema = { type: "unknown" as any, coerce: true };
      const value = "test";

      const result = coerce(schema, value);

      expect(result).toBe(value);
    });
  });
});
