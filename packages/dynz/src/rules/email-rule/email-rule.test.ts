import { beforeEach, describe, expect, it, vi } from "vitest";
import { type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { email, emailRule } from "./index";

describe("email rule", () => {
  it("should create email rule", () => {
    const rule = email();

    expect(rule).toEqual({
      type: "email",
    });
  });

  it("should create email rule with custom code", () => {
    const rule = email("INVALID_EMAIL");

    expect(rule).toEqual({
      type: "email",
      code: "INVALID_EMAIL",
    });
  });
});

describe("emailRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined for valid email addresses", async () => {
    const rule = email();

    const validEmails = [
      "test@example.com",
      "user.name@domain.co.uk",
      "firstname+lastname@example.org",
      "user_name@example-domain.com",
      "test123@test.co",
    ];

    for (const validEmail of validEmails) {
      const result = emailRule({
        rule,
        value: validEmail,
        path: "testPath",
        schema: mockSchema,
        context: mockContext,
      });

      expect(result).toBeUndefined();
    }
  });

  it("should return error for invalid email addresses", async () => {
    const rule = email();

    const invalidEmails = [
      "invalid-email",
      "@domain.com",
      "user@",
      "user@domain",
      "user..name@domain.com",
      ".user@domain.com",
      "user@domain..com",
      "",
    ];

    for (const invalidEmail of invalidEmails) {
      const result = emailRule({
        rule,
        value: invalidEmail,
        path: "testPath",
        schema: mockSchema,
        context: mockContext,
      });

      expect(result).toBeDefined();
      expect(result?.code).toBe("email");
      expect(result?.message).toContain("not a valid email address");
    }
  });

  it("should include correct error message format", async () => {
    const rule = email();

    const result = emailRule({
      rule,
      value: "invalid-email",
      path: "$.userEmail",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("invalid-email");
    expect(result?.message).toContain("not a valid email address");
    expect(result?.code).toBe("email");
  });

  it("should handle edge case email formats", async () => {
    const rule = email();

    const result = emailRule({
      rule,
      value: "a@b.co",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });
});
