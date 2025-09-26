import { describe, expect, it } from "vitest";
import { type MaskedPrivateValue, mask, type PlainPrivateValue, plain } from "./private";

describe("private", () => {
  describe("plain", () => {
    it("should create plain private value with string", () => {
      const result = plain("test");

      expect(result).toEqual({
        state: "plain",
        value: "test",
      });
    });

    it("should create plain private value with number", () => {
      const result = plain(123);

      expect(result).toEqual({
        state: "plain",
        value: 123,
      });
    });

    it("should create plain private value with undefined", () => {
      const result = plain(undefined);

      expect(result).toEqual({
        state: "plain",
        value: undefined,
      });
    });

    it("should create plain private value with no arguments", () => {
      const result = plain();

      expect(result).toEqual({
        state: "plain",
        value: undefined,
      });
    });

    it("should have correct type for string value", () => {
      const result = plain("test");
      const expected: PlainPrivateValue<string> = result;
      expect(expected).toBeDefined();
    });

    it("should have correct type for number value", () => {
      const result = plain(42);
      const expected: PlainPrivateValue<number> = result;
      expect(expected).toBeDefined();
    });
  });

  describe("mask", () => {
    it("should create masked private value with default mask function", () => {
      const result = mask("sensitive");

      expect(result).toEqual({
        state: "masked",
        value: "***",
      });
    });

    it("should create masked private value with custom mask function", () => {
      const customMask = (value?: string | number) => `[HIDDEN: ${value}]`;
      const result = mask("secret", customMask);

      expect(result).toEqual({
        state: "masked",
        value: "[HIDDEN: secret]",
      });
    });

    it("should mask number values", () => {
      const result = mask(12345);

      expect(result).toEqual({
        state: "masked",
        value: "***",
      });
    });

    it("should mask number values with custom function", () => {
      const customMask = (value?: string | number) => `REDACTED_${value}`;
      const result = mask(98765, customMask);

      expect(result).toEqual({
        state: "masked",
        value: "REDACTED_98765",
      });
    });

    it("should mask PlainPrivateValue input", () => {
      const plainValue = plain("password");
      const result = mask(plainValue);

      expect(result).toEqual({
        state: "masked",
        value: "***",
      });
    });

    it("should mask PlainPrivateValue with custom function", () => {
      const plainValue = plain("confidential");
      const customMask = (value?: string | number) => `XXX-${value}-XXX`;
      const result = mask(plainValue, customMask);

      expect(result).toEqual({
        state: "masked",
        value: "XXX-confidential-XXX",
      });
    });

    it("should handle undefined value", () => {
      const result = mask(undefined);
      expect(result).toEqual({
        state: "masked",
        value: "***",
      });
    });

    it("should handle undefined value with custom mask function", () => {
      const customMask = (value?: string | number) => (value ? `HIDDEN: ${value}` : "NO_VALUE");
      const result = mask(undefined, customMask);

      expect(result).toEqual({
        state: "masked",
        value: "NO_VALUE",
      });
    });

    it("should handle PlainPrivateValue with undefined value", () => {
      const plainValue = plain(undefined);
      const result = mask(plainValue);

      expect(result).toEqual({
        state: "masked",
        value: "***",
      });
    });

    it("should handle empty string", () => {
      const result = mask("");

      expect(result).toEqual({
        state: "masked",
        value: "***",
      });
    });

    it("should handle zero as number", () => {
      const result = mask(0);

      expect(result).toEqual({
        state: "masked",
        value: "***",
      });
    });

    it("should have correct return type", () => {
      const result = mask("test");
      const expected: MaskedPrivateValue = result;
      expect(expected).toBeDefined();
    });

    it("should work with complex custom mask functions", () => {
      const customMask = (value?: string | number) => {
        if (value === undefined) return "UNDEFINED";
        if (typeof value === "string") return `STR_${value.length}`;
        if (typeof value === "number") return `NUM_${value}`;
        return "UNKNOWN";
      };

      expect(mask("hello", customMask)).toEqual({
        state: "masked",
        value: "STR_5",
      });

      expect(mask(42, customMask)).toEqual({
        state: "masked",
        value: "NUM_42",
      });

      expect(mask(undefined, customMask)).toEqual({
        state: "masked",
        value: "UNDEFINED",
      });
    });
  });
});
