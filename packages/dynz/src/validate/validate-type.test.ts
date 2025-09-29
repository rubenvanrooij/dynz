import { describe, expect, it } from "vitest";
import { enum as enumBuilder, object, string } from "../schemas";
import { SchemaType } from "../types";
import {
  isArray,
  isBoolean,
  isDate,
  isDateString,
  isEnum,
  isFile,
  isNumber,
  isObject,
  isOption,
  isString,
  validateShallowType,
  validateType,
} from "./validate-type";

describe("validateType", () => {
  it("should validate all schema types correctly", () => {
    // String
    expect(validateType(string(), "test")).toBe(true);
    expect(validateType(string(), 123)).toBe(false);

    // Object
    expect(validateType(object({ fields: {} }), {})).toBe(true);
    expect(validateType(object({ fields: {} }), [])).toBe(false);

    // Enum
    const testEnum = { ADMIN: "admin", USER: "user" } as const;
    expect(validateType(enumBuilder({ enum: testEnum }), "admin")).toBe(true);
    expect(validateType(enumBuilder({ enum: testEnum }), "invalid")).toBe(false);
  });
});

describe("validateShallowType", () => {
  it("should validate primitive types without deep validation", () => {
    expect(validateShallowType(SchemaType.STRING, "test")).toBe(true);
    expect(validateShallowType(SchemaType.NUMBER, 123)).toBe(true);
    expect(validateShallowType(SchemaType.BOOLEAN, true)).toBe(true);
    expect(validateShallowType(SchemaType.ENUM, "any-string")).toBe(true);
    expect(validateShallowType(SchemaType.ENUM, 123)).toBe(true);
    expect(validateShallowType(SchemaType.ENUM, {})).toBe(false);
  });
});

describe("type checking functions", () => {
  it("should validate strings correctly", () => {
    expect(isString("test")).toBe(true);
    expect(isString(123)).toBe(false);
  });

  it("should validate numbers correctly", () => {
    expect(isNumber(123)).toBe(true);
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber("123")).toBe(false);
  });

  it("should validate dates correctly", () => {
    expect(isDate(new Date())).toBe(true);
    expect(isDate(new Date("invalid"))).toBe(false);
    expect(isDate("2023-01-01")).toBe(false);
  });

  it("should validate objects correctly", () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
  });

  it("should validate arrays correctly", () => {
    expect(isArray([])).toBe(true);
    expect(isArray({})).toBe(false);
  });

  it("should validate enums correctly", () => {
    const testEnum = { ADMIN: "admin", USER: "user" } as const;
    expect(isEnum(testEnum, "admin")).toBe(true);
    expect(isEnum(testEnum, "invalid")).toBe(false);
  });

  it("should validate options correctly", () => {
    const options = ["option1", "option2"] as const;
    expect(isOption(options, "option1")).toBe(true);
    expect(isOption(options, "invalid")).toBe(false);
  });

  it("should validate date strings correctly", () => {
    expect(isDateString("2023-01-01", "yyyy-MM-dd")).toBe(true);
    expect(isDateString("invalid", "yyyy-MM-dd")).toBe(false);
    expect(isDateString(123, "yyyy-MM-dd")).toBe(false);
  });

  it("should validate files correctly", () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    expect(isFile(file)).toBe(true);
    expect(isFile({})).toBe(false);
  });

  it("should validate booleans correctly", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean("true")).toBe(false);
  });
});
