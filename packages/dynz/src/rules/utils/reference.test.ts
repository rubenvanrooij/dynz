import { describe, expect, it } from "vitest";
import { SchemaType } from "../../types";
import { parseDateString } from "../../validate/validate-type";
import { getDateFromDateOrDateStringRefeference } from "./reference";

describe("getDateFromDateOrDateStringRefeference", () => {
  describe("date schema type references", () => {
    it("should return Date value directly for date schema", () => {
      const testDate = new Date("2024-01-15T10:30:00Z");
      const reference = {
        schema: { type: "date" as const, format: undefined },
        type: SchemaType.DATE,
        value: testDate,
        static: false as const,
      };

      const result = getDateFromDateOrDateStringRefeference(reference);

      expect(result).toBe(testDate);
      expect(result).toBeInstanceOf(Date);
    });

    it("should return undefined when date schema has undefined value", () => {
      const reference = {
        schema: { type: "date" as const, format: undefined },
        type: SchemaType.DATE,
        value: undefined,
        static: false as const,
      };

      const result = getDateFromDateOrDateStringRefeference(reference);

      expect(result).toBeUndefined();
    });
  });

  describe("DATE_STRING schema type references", () => {
    it("should parse date string value for DATE_STRING schema with yyyy-MM-dd format", () => {
      const reference = {
        schema: { type: "date_string" as const, format: "yyyy-MM-dd" },
        type: SchemaType.DATE_STRING,
        value: "2024-01-15",
        static: false as const,
      };

      const result = getDateFromDateOrDateStringRefeference(reference);

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January is 0-indexed
      expect(result?.getDate()).toBe(15);
    });

    it("should parse date string value for DATE_STRING schema with yyyy format", () => {
      const reference = {
        schema: { type: "date_string" as const, format: "yyyy" },
        type: SchemaType.DATE_STRING,
        value: "2025",
        static: false as const,
      };

      const result = getDateFromDateOrDateStringRefeference(reference);

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });

    it("should parse date string value for DATE_STRING schema with dd/MM/yyyy format", () => {
      const reference = {
        schema: { type: "date_string" as const, format: "dd/MM/yyyy" },
        type: SchemaType.DATE_STRING,
        value: "15/01/2024",
        static: false as const,
      };

      const result = getDateFromDateOrDateStringRefeference(reference);

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January is 0-indexed
      expect(result?.getDate()).toBe(15);
    });

    it("should parse date string value for DATE_STRING schema with MM/dd/yyyy format", () => {
      const reference = {
        schema: { type: "date_string" as const, format: "MM/dd/yyyy" },
        type: SchemaType.DATE_STRING,
        value: "01/15/2024",
        static: false as const,
      };

      const result = getDateFromDateOrDateStringRefeference(reference);

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January is 0-indexed
      expect(result?.getDate()).toBe(15);
    });

    it("should return undefined when DATE_STRING schema has undefined value", () => {
      const reference = {
        schema: { type: "date_string" as const, format: "yyyy-MM-dd" },
        type: SchemaType.DATE_STRING,
        value: undefined,
        static: false as const,
      };

      const result = getDateFromDateOrDateStringRefeference(reference);

      expect(result).toBeUndefined();
    });

    it("should handle empty string value", () => {
      const reference = {
        schema: { type: "date_string" as const, format: "yyyy-MM-dd" },
        type: SchemaType.DATE_STRING,
        value: "",
        static: false as const,
      };

      const result = getDateFromDateOrDateStringRefeference(reference);

      // The parseDateString function should handle empty strings appropriately
      // This test ensures the utility function doesn't crash
      expect(result).toBeDefined();
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle invalid date string gracefully", () => {
      const reference = {
        schema: { type: "date_string" as const, format: "yyyy-MM-dd" },
        type: SchemaType.DATE_STRING,
        value: "invalid-date",
        static: false as const,
      };

      // This should not throw an error, the parseDateString function should handle it
      expect(() => getDateFromDateOrDateStringRefeference(reference)).not.toThrow();
    });

    it("should handle mismatched format and value", () => {
      const reference = {
        schema: { type: "date_string" as const, format: "yyyy-MM-dd" },
        type: SchemaType.DATE_STRING,
        value: "2024", // Should be yyyy-MM-dd but only has year
        static: false as const,
      };

      // This should not throw an error
      expect(() => getDateFromDateOrDateStringRefeference(reference)).not.toThrow();
    });

    it("should handle leap year dates correctly", () => {
      const reference = {
        schema: { type: "date_string" as const, format: "yyyy-MM-dd" },
        type: SchemaType.DATE_STRING,
        value: "2024-02-29", // Leap year
        static: false as const,
      };

      const result = getDateFromDateOrDateStringRefeference(reference);

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(1); // February is 1-indexed
      expect(result?.getDate()).toBe(29);
    });
  });

  describe("type safety", () => {
    it("should work with union type parameter", () => {
      // This test ensures the function works with the union type as expected
      const dateReference = {
        schema: { type: "date" as const, format: undefined },
        type: SchemaType.DATE,
        value: parseDateString("2024-01-01"),
        static: false as const,
      };

      const dateStringReference = {
        schema: { type: "date_string" as const, format: "yyyy-MM-dd" },
        type: SchemaType.DATE_STRING,
        value: "2024-01-01",
        static: false as const,
      };

      // Both should work with the same function
      const dateResult = getDateFromDateOrDateStringRefeference(dateReference);
      const dateStringResult = getDateFromDateOrDateStringRefeference(dateStringReference);

      expect(dateResult).toBeInstanceOf(Date);
      expect(dateStringResult).toBeInstanceOf(Date);
      expect(dateResult?.getTime()).toBe(dateStringResult?.getTime());
    });
  });
});
