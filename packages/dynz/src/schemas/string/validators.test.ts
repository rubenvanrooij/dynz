import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../types";
import { SchemaType } from "../../types";
import { validateString } from "./validators";
import { string } from "./builder";
import { minLength, maxLength, equals, regex, isNumeric, email, oneOf, custom } from "../../rules";

// Mock the rules
vi.mock("../../rules", () => ({
  minLengthRule: vi.fn(),
  maxLengthRule: vi.fn(),
  equalsRule: vi.fn(),
  regexRule: vi.fn(),
  isNumericRule: vi.fn(),
  emailRule: vi.fn(),
  oneOfRule: vi.fn(),
  customRule: vi.fn(),
  minLength: vi.fn(),
  maxLength: vi.fn(),
  equals: vi.fn(),
  regex: vi.fn(),
  isNumeric: vi.fn(),
  email: vi.fn(),
  oneOf: vi.fn(),
  custom: vi.fn(),
}));

import {
  minLengthRule,
  maxLengthRule,
  equalsRule,
  regexRule,
  isNumericRule,
  emailRule,
  oneOfRule,
  customRule,
} from "../../rules";

describe("validateString", () => {
  const mockSchema = string();
  const mockContext = {} as unknown as Context<typeof mockSchema>;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(minLength).mockImplementation((min) => ({ type: "min_length", min }));
    vi.mocked(maxLength).mockImplementation((max) => ({ type: "max_length", max }));
    vi.mocked(equals).mockImplementation((equals) => ({ type: "equals", equals }));
    vi.mocked(regex).mockImplementation((regex) => ({ type: "regex", regex }));
    vi.mocked(isNumeric).mockImplementation(() => ({ type: "is_numeric" }));
    vi.mocked(email).mockImplementation(() => ({ type: "email" }));
    vi.mocked(oneOf).mockImplementation((values) => ({ type: "one_of", values }));
    vi.mocked(custom).mockImplementation((name) => ({ type: "custom", name, params: {} }));
  });

  it("should delegate to minLengthRule for min_length validation", () => {
    const rule = minLength(5);
    const contextObj = {
      type: SchemaType.STRING,
      ruleType: "min_length" as const,
      rule,
      schema: mockSchema,
      path: "$.name",
      value: "hello",
      context: mockContext,
    };

    vi.mocked(minLengthRule).mockReturnValue(undefined);
    const result = validateString(contextObj);
    expect(minLengthRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to maxLengthRule for max_length validation", () => {
    const rule = maxLength(10);
    const contextObj = {
      type: SchemaType.STRING,
      ruleType: "max_length" as const,
      rule,
      schema: mockSchema,
      path: "$.name",
      value: "hello",
      context: mockContext,
    };

    vi.mocked(maxLengthRule).mockReturnValue(undefined);
    const result = validateString(contextObj);
    expect(maxLengthRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to equalsRule for equals validation", () => {
    const rule = equals("test");
    const contextObj = {
      type: SchemaType.STRING,
      ruleType: "equals" as const,
      rule,
      schema: mockSchema,
      path: "$.name",
      value: "test",
      context: mockContext,
    };

    vi.mocked(equalsRule).mockReturnValue(undefined);
    const result = validateString(contextObj);
    expect(equalsRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to regexRule for regex validation", () => {
    const rule = regex("^[a-z]+$");
    const contextObj = {
      type: SchemaType.STRING,
      ruleType: "regex" as const,
      rule,
      schema: mockSchema,
      path: "$.name",
      value: "hello",
      context: mockContext,
    };

    vi.mocked(regexRule).mockReturnValue(undefined);
    const result = validateString(contextObj);
    expect(regexRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to isNumericRule for is_numeric validation", () => {
    const rule = isNumeric();
    const contextObj = {
      type: SchemaType.STRING,
      ruleType: "is_numeric" as const,
      rule,
      schema: mockSchema,
      path: "$.number",
      value: "123",
      context: mockContext,
    };

    vi.mocked(isNumericRule).mockReturnValue(undefined);
    const result = validateString(contextObj);
    expect(isNumericRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to emailRule for email validation", () => {
    const rule = email();
    const contextObj = {
      type: SchemaType.STRING,
      ruleType: "email" as const,
      rule,
      schema: mockSchema,
      path: "$.email",
      value: "test@example.com",
      context: mockContext,
    };

    vi.mocked(emailRule).mockReturnValue(undefined);
    const result = validateString(contextObj);
    expect(emailRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to oneOfRule for one_of validation", () => {
    const rule = oneOf(["a", "b", "c"]);
    const contextObj = {
      type: SchemaType.STRING,
      ruleType: "one_of" as const,
      rule,
      schema: mockSchema,
      path: "$.option",
      value: "a",
      context: mockContext,
    };

    vi.mocked(oneOfRule).mockReturnValue(undefined);
    const result = validateString(contextObj);
    expect(oneOfRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });

  it("should delegate to customRule for custom validation", () => {
    const rule = custom("testRule");
    const contextObj = {
      type: SchemaType.STRING,
      ruleType: "custom" as const,
      rule,
      schema: mockSchema,
      path: "$.name",
      value: "test",
      context: mockContext,
    };

    vi.mocked(customRule).mockReturnValue(undefined);
    const result = validateString(contextObj);
    expect(customRule).toHaveBeenCalledWith(contextObj);
    expect(result).toBeUndefined();
  });
});
