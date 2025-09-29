import { beforeEach, describe, expect, it, vi } from "vitest";
import { type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { regex, regexRule } from "./index";

describe("regex rule", () => {
  it("should create regex rule for email validation", () => {
    const rule = regex("^[^@]+@[^@]+\\.[^@]+$");

    expect(rule).toEqual({
      type: "regex",
      regex: "^[^@]+@[^@]+\\.[^@]+$",
    });
  });

  it("should create regex rule for phone number validation", () => {
    const rule = regex("^\\+?[1-9]\\d{1,14}$");

    expect(rule).toEqual({
      type: "regex",
      regex: "^\\+?[1-9]\\d{1,14}$",
    });
  });

  it("should create regex rule for alphanumeric validation", () => {
    const rule = regex("^[a-zA-Z0-9]+$");

    expect(rule).toEqual({
      type: "regex",
      regex: "^[a-zA-Z0-9]+$",
    });
  });

  it("should create regex rule for URL validation", () => {
    const urlPattern =
      "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$";
    const rule = regex(urlPattern);

    expect(rule).toEqual({
      type: "regex",
      regex: urlPattern,
    });
  });

  it("should create regex rule for password strength", () => {
    const passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    const rule = regex(passwordPattern);

    expect(rule).toEqual({
      type: "regex",
      regex: passwordPattern,
    });
  });

  it("should handle simple patterns", () => {
    const rule = regex("[0-9]+");

    expect(rule).toEqual({
      type: "regex",
      regex: "[0-9]+",
    });
  });

  it("should create regex rule with custom code", () => {
    const rule = regex("^[A-Z]+$", "UPPERCASE_ONLY");

    expect(rule).toEqual({
      type: "regex",
      regex: "^[A-Z]+$",
      code: "UPPERCASE_ONLY",
    });
  });
});

describe("regexRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value matches regex pattern", async () => {
    const rule = regex("^[0-9]+$");

    const result = regexRule({
      rule,
      value: "12345",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value does not match regex pattern", async () => {
    const rule = regex("^[0-9]+$");

    const result = regexRule({
      rule,
      value: "abc123",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("regex");
    expect(result?.message).toContain("does not match the regex");
  });

  it("should handle email regex validation", async () => {
    const rule = regex("^[^@]+@[^@]+\\.[^@]+$");

    const validEmail = regexRule({
      rule,
      value: "test@example.com",
      path: "email",
      schema: mockSchema,
      context: mockContext,
    });

    const invalidEmail = regexRule({
      rule,
      value: "invalid-email",
      path: "email",
      schema: mockSchema,
      context: mockContext,
    });

    expect(validEmail).toBeUndefined();
    expect(invalidEmail).toBeDefined();
    expect(invalidEmail?.code).toBe("regex");
  });

  it("should include correct error message format", async () => {
    const rule = regex("^[A-Z]+$");

    const result = regexRule({
      rule,
      value: "lowercase",
      path: "$.code",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("lowercase");
    expect(result?.message).toContain("does not match the regex");
    expect(result?.message).toContain("^[A-Z]+$");
    expect(result?.code).toBe("regex");
  });

  it("should handle complex regex patterns", async () => {
    const passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    const rule = regex(passwordPattern);

    const strongPassword = regexRule({
      rule,
      value: "StrongPass123!",
      path: "password",
      schema: mockSchema,
      context: mockContext,
    });

    const weakPassword = regexRule({
      rule,
      value: "weak",
      path: "password",
      schema: mockSchema,
      context: mockContext,
    });

    expect(strongPassword).toBeUndefined();
    expect(weakPassword).toBeDefined();
    expect(weakPassword?.code).toBe("regex");
  });

  it("should handle case-sensitive patterns", async () => {
    const rule = regex("^[a-z]+$");

    const lowercase = regexRule({
      rule,
      value: "lowercase",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    const uppercase = regexRule({
      rule,
      value: "UPPERCASE",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(lowercase).toBeUndefined();
    expect(uppercase).toBeDefined();
  });
});
