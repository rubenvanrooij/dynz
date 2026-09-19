import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type NumberSchema, number, type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { buildNotEqualsRule, notEqualsRule } from "./index";

describe("not equals rule", () => {
  it("should create not equals rule with string value", () => {
    const rule = buildNotEqualsRule(v("admin"));

    expect(rule).toEqual({
      type: "not_equals",
      notEquals: v("admin"),
    });
  });

  it("should create not equals rule with number value", () => {
    const rule = buildNotEqualsRule(v(42));

    expect(rule).toEqual({
      type: "not_equals",
      notEquals: v(42),
    });
  });

  it("should create not equals rule with boolean value", () => {
    const rule = buildNotEqualsRule(v(true));

    expect(rule).toEqual({
      type: "not_equals",
      notEquals: v(true),
    });
  });

  it("should create not equals rule with reference", () => {
    const reference = ref("oldPassword");
    const rule = buildNotEqualsRule(reference);

    expect(rule).toEqual({
      type: "not_equals",
      notEquals: { type: REFERENCE_TYPE, path: "oldPassword" },
    });
  });

  it("should create not equals rule with cross-field reference", () => {
    const rule = buildNotEqualsRule(ref("$.user.bannedRole"));

    expect(rule).toEqual({
      type: "not_equals",
      notEquals: { type: REFERENCE_TYPE, path: "$.user.bannedRole" },
    });
  });

  it("should create not equals rule with custom error code", () => {
    const rule = buildNotEqualsRule(v("admin"), "FORBIDDEN_ROLE");

    expect(rule).toEqual({
      type: "not_equals",
      notEquals: v("admin"),
      code: "FORBIDDEN_ROLE",
    });
  });
});

describe("notEqualsRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  it("should return undefined when value does not equal expected value", async () => {
    const rule = buildNotEqualsRule(v("admin"));

    const result = await notEqualsRule({
      rule,
      value: "user",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value equals expected value", async () => {
    const rule = buildNotEqualsRule(v("admin"));

    const result = await notEqualsRule({
      rule,
      value: "admin",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("not_equals");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("equals");
  });

  it("should handle number values correctly", async () => {
    const numberMockContext = {} as unknown as Context<NumberSchema>;
    const numberMockSchema = number();
    const rule = buildNotEqualsRule(v(42));

    const result = await notEqualsRule({
      rule,
      value: 41,
      path: "testPath",
      schema: numberMockSchema,
      context: numberMockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = buildNotEqualsRule(v("admin"));

    const result = await notEqualsRule({
      rule,
      value: "admin",
      path: "$.role",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.role");
    expect(result?.message).toContain("equals admin");
    expect(result?.code).toBe("not_equals");
  });
});
