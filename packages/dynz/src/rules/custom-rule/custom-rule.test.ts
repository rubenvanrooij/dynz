import { beforeEach, describe, expect, it, vi } from "vitest";
import { v } from "../../functions";
import { ref } from "../../reference";
import { type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { buildCustomRule, customRule } from "./index";

describe("custom rule", () => {
  it("should create custom rule with name only", () => {
    const rule = buildCustomRule("validateUniqueEmail");

    expect(rule).toEqual({
      type: "custom",
      name: "validateUniqueEmail",
      params: {},
    });
  });

  it("should create custom rule with name and params", () => {
    const rule = buildCustomRule("validateLength", {
      min: v(5),
      max: v(50),
    });

    expect(rule).toEqual({
      type: "custom",
      name: "validateLength",
      params: {
        min: v(5),
        max: v(50),
      },
    });
  });

  it("should create custom rule with reference parameters", () => {
    const rule = buildCustomRule("validateGreaterThan", {
      threshold: ref("minimumValue"),
      strict: v(true),
    });

    expect(rule.name).toBe("validateGreaterThan");
    expect(rule.params.threshold).toEqual(ref("minimumValue"));
    expect(rule.params.strict).toEqual(v(true));
  });

  it("should handle empty params object", () => {
    const rule = buildCustomRule("simpleValidation", {});

    expect(rule).toEqual({
      type: "custom",
      name: "simpleValidation",
      params: {},
    });
  });
});

describe("customRule validator", () => {
  const mockSchema = string();
  let mockContext: Context<StringSchema>;

  beforeEach(() => {
    mockContext = {
      validateOptions: {
        customRules: {},
      },
    } as unknown as Context<StringSchema>;
  });

  it("should return undefined when custom validator returns true", async () => {
    const rule = buildCustomRule("validateEmail");
    const mockValidator = vi.fn().mockResolvedValue(true);
    mockContext.validateOptions.customRules = {
      validateEmail: mockValidator,
    };

    const result = await customRule({
      rule,
      value: "test@example.com",
      path: "email",
      schema: mockSchema,
      context: mockContext,
    });

    expect(mockValidator).toHaveBeenCalledWith(
      {
        schema: mockSchema,
        value: "test@example.com",
      },
      {},
      "email",
      mockSchema
    );
    expect(result).toBeUndefined();
  });

  it("should return error when custom validator returns false", async () => {
    const rule = buildCustomRule("validateEmail");
    const mockValidator = vi.fn().mockResolvedValue(false);
    mockContext.validateOptions.customRules = {
      validateEmail: mockValidator,
    };

    const result = await customRule({
      rule,
      value: "invalid-email",
      path: "email",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("custom");
    expect(result?.name).toBe("validateEmail");
    expect(result?.message).toContain("email");
    expect(result?.message).toContain("validateEmail");
    expect(result?.params).toEqual({});
  });

  it("should return custom error object when validator returns error object", async () => {
    const rule = buildCustomRule("validatePassword", {
      details: v({ requirement: "uppercase" }),
    });
    const customError = {
      result: false,
      code: "PASSWORD_UPPERCASE_REQUIRED",
    };

    const mockValidator = vi.fn().mockResolvedValue(customError);
    mockContext.validateOptions.customRules = {
      validatePassword: mockValidator,
    };

    const result = await customRule({
      rule,
      value: "weakpassword",
      path: "password",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.message).toBe(
      `The value for schema password did not pass the custom validation rule "validatePassword"`
    );
    expect(result?.result.code).toBe("PASSWORD_UPPERCASE_REQUIRED");
    expect(result?.name).toBe("validatePassword");
  });

  it("should throw error when custom rule is not defined", async () => {
    const rule = buildCustomRule("undefinedRule");
    mockContext.validateOptions.customRules = {};

    await expect(() =>
      customRule({
        rule,
        value: "test",
        path: "testPath",
        schema: mockSchema,
        context: mockContext,
      })
    ).rejects.toThrow('Custom rule "undefinedRule" is not defined in the custom rules map.');
  });

  it("should unpack reference parameters correctly", async () => {
    const rule = buildCustomRule("validateLength", {
      minLength: v(5),
      maxLength: v(20),
    });
    const mockValidator = vi.fn().mockResolvedValue(true);
    mockContext.validateOptions.customRules = {
      validateLength: mockValidator,
    };

    await customRule({
      rule,
      value: "test string",
      path: "text",
      schema: mockSchema,
      context: mockContext,
    });

    expect(mockValidator).toHaveBeenCalledWith(
      {
        schema: mockSchema,
        value: "test string",
      },
      {
        minLength: 5,
        maxLength: 20,
      },
      "text",
      mockSchema
    );
  });

  it("should handle empty custom rules object", async () => {
    const rule = buildCustomRule("missingRule");
    mockContext.validateOptions.customRules = undefined;

    await expect(() =>
      customRule({
        rule,
        value: "test",
        path: "testPath",
        schema: mockSchema,
        context: mockContext,
      })
    ).rejects.toThrow('Custom rule "missingRule" is not defined in the custom rules map.');
  });

  it("should include correct error message format for default error", async () => {
    const rule = buildCustomRule("validateFormat");
    const mockValidator = vi.fn().mockResolvedValue(false);
    mockContext.validateOptions.customRules = {
      validateFormat: mockValidator,
    };

    const result = await customRule({
      rule,
      value: "invalid-format",
      path: "$.userInput",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.userInput");
    expect(result?.message).toContain("validateFormat");
    expect(result?.message).toBe(
      'The value for schema $.userInput did not pass the custom validation rule "validateFormat"'
    );
    expect(result?.code).toBe("custom");
    expect(result?.name).toBe("validateFormat");
  });

  it("should handle validator with no parameters", async () => {
    const rule = buildCustomRule("simpleValidation");
    const mockValidator = vi.fn().mockResolvedValue(true);
    mockContext.validateOptions.customRules = {
      simpleValidation: mockValidator,
    };

    const result = await customRule({
      rule,
      value: "any-value",
      path: "field",
      schema: mockSchema,
      context: mockContext,
    });

    expect(mockValidator).toHaveBeenCalledWith(
      {
        schema: mockSchema,
        value: "any-value",
      },
      {},
      "field",
      mockSchema
    );
    expect(result).toBeUndefined();
  });
});
