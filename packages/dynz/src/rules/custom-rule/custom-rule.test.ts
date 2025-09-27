import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { custom, customRule } from "./index";

vi.mock("../../reference", () => {
  return {
    ref: (path: string) => ({
      _type: REFERENCE_TYPE,
      path: path,
    }),
    REFERENCE_TYPE: "MOCKED_REFERENCE_TYPE",
    unpackRef: vi.fn(),
  };
});

describe("custom rule", () => {
  it("should create custom rule with name only", () => {
    const rule = custom("validateUniqueEmail");

    expect(rule).toEqual({
      type: "custom",
      name: "validateUniqueEmail",
      params: {},
    });
  });

  it("should create custom rule with name and params", () => {
    const rule = custom("validateLength", {
      min: 5,
      max: 50,
    });

    expect(rule).toEqual({
      type: "custom",
      name: "validateLength",
      params: {
        min: 5,
        max: 50,
      },
    });
  });

  it("should create custom rule with reference parameters", () => {
    const rule = custom("validateGreaterThan", {
      threshold: ref("minimumValue"),
      strict: true,
    });

    expect(rule).toEqual({
      type: "custom",
      name: "validateGreaterThan",
      params: {
        threshold: {
          _type: REFERENCE_TYPE,
          path: "minimumValue",
        },
        strict: true,
      },
    });
  });

  it("should create custom rule with complex parameters", () => {
    const rule = custom("validateBusinessRules", {
      category: "finance",
      limits: {
        daily: ref("$.settings.dailyLimit"),
        monthly: ref("$.settings.monthlyLimit"),
      },
      allowOverride: false,
      notificationEmail: "admin@company.com",
    });

    expect(rule.name).toBe("validateBusinessRules");
    expect(rule.params.category).toBe("finance");
    expect(rule.params.limits.daily).toEqual({
      _type: REFERENCE_TYPE,
      path: "$.settings.dailyLimit",
    });
    expect(rule.params.allowOverride).toBe(false);
  });

  it("should handle empty params object", () => {
    const rule = custom("simpleValidation", {});

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
    vi.resetAllMocks();
    mockContext = {
      validateOptions: {
        customRules: {},
      },
    } as unknown as Context<StringSchema>;
  });

  it("should return undefined when custom validator returns true", async () => {
    const rule = custom("validateEmail");
    const mockValidator = vi.fn().mockReturnValue(true);
    mockContext.validateOptions.customRules = {
      validateEmail: mockValidator,
    };

    const result = customRule({
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
    const rule = custom("validateEmail");
    const mockValidator = vi.fn().mockReturnValue(false);
    mockContext.validateOptions.customRules = {
      validateEmail: mockValidator,
    };

    const result = customRule({
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
    const rule = custom("validatePassword", {
      details: {
        requirement: "uppercase",
      },
    });
    const customError = {
      result: false,
      code: "PASSWORD_UPPERCASE_REQUIRED",
    };

    vi.mocked(unpackRef).mockImplementation((value) => ({ value }) as ReturnType<typeof unpackRef>);

    const mockValidator = vi.fn().mockReturnValue(customError);
    mockContext.validateOptions.customRules = {
      validatePassword: mockValidator,
    };

    const result = customRule({
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
    expect(result?.params.details).toEqual({ requirement: "uppercase" });
  });

  it("should throw error when custom rule is not defined", async () => {
    const rule = custom("undefinedRule");
    mockContext.validateOptions.customRules = {};

    expect(() => {
      customRule({
        rule,
        value: "test",
        path: "testPath",
        schema: mockSchema,
        context: mockContext,
      });
    }).toThrow('Custom rule "undefinedRule" is not defined in the custom rules map.');
  });

  it("should unpack reference parameters correctly", async () => {
    const rule = custom("validateLength", {
      minLength: ref("minLengthValue"),
      maxLength: 20,
    });
    const mockValidator = vi.fn().mockReturnValue(true);
    mockContext.validateOptions.customRules = {
      validateLength: mockValidator,
    };

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === rule.params.minLength) {
        return { value: 5 } as ReturnType<typeof unpackRef>;
      }
      if (value === 20) {
        return { value: 20 } as ReturnType<typeof unpackRef>;
      }
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

    const result = customRule({
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
    expect(result).toBeUndefined();
  });

  it("should handle complex parameters with nested references", async () => {
    const rule = custom("validateBusinessRules", {
      category: "finance",
      threshold: ref("$.settings.threshold"),
      allowOverride: false,
    });
    const mockValidator = vi.fn().mockReturnValue(true);
    mockContext.validateOptions.customRules = {
      validateBusinessRules: mockValidator,
    };

    vi.mocked(unpackRef).mockImplementation((value) => {
      if (value === rule.params.threshold) {
        return { value: 1000 } as ReturnType<typeof unpackRef>;
      }
      if (value === "finance") {
        return { value: "finance" } as ReturnType<typeof unpackRef>;
      }
      if (value === false) {
        return { value: false } as ReturnType<typeof unpackRef>;
      }
      return { value: undefined } as ReturnType<typeof unpackRef>;
    });

    const result = customRule({
      rule,
      value: 500,
      path: "amount",
      schema: mockSchema,
      context: mockContext,
    });

    expect(mockValidator).toHaveBeenCalledWith(
      {
        schema: mockSchema,
        value: 500,
      },
      {
        category: "finance",
        threshold: 1000,
        allowOverride: false,
      },
      "amount",
      mockSchema
    );
    expect(result).toBeUndefined();
  });

  it("should handle validator that returns custom error with additional properties", async () => {
    const rule = custom("validateCreditCard", {
      paramOne: "one",
      paramTwo: "two",
    });

    const customError = {
      cardType: "visa",
      suggestion: "Please check the card number",
    };

    vi.mocked(unpackRef).mockImplementation((value) => ({ value }) as ReturnType<typeof unpackRef>);

    const mockValidator = vi.fn().mockReturnValue(customError);

    mockContext.validateOptions.customRules = {
      validateCreditCard: mockValidator,
    };

    const result = customRule({
      rule,
      value: "1234-5678-9012-3456",
      path: "cardNumber",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.message).toBe(
      `The value for schema cardNumber did not pass the custom validation rule "validateCreditCard"`
    );
    expect(result?.result.cardType).toBe("visa");
    expect(result?.result.suggestion).toBe("Please check the card number");
    expect(result?.name).toBe("validateCreditCard");
  });

  it("should handle empty custom rules object", async () => {
    const rule = custom("missingRule");
    mockContext.validateOptions.customRules = undefined;

    expect(() => {
      customRule({
        rule,
        value: "test",
        path: "testPath",
        schema: mockSchema,
        context: mockContext,
      });
    }).toThrow('Custom rule "missingRule" is not defined in the custom rules map.');
  });

  it("should include correct error message format for default error", async () => {
    const rule = custom("validateFormat");
    const mockValidator = vi.fn().mockReturnValue(false);
    mockContext.validateOptions.customRules = {
      validateFormat: mockValidator,
    };

    const result = customRule({
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
    const rule = custom("simpleValidation");
    const mockValidator = vi.fn().mockReturnValue(true);
    mockContext.validateOptions.customRules = {
      simpleValidation: mockValidator,
    };

    const result = customRule({
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
