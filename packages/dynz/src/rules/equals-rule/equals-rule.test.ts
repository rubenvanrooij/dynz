import { describe, expect, it } from "vitest";
import { v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { type NumberSchema, number, type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { equals, equalsRule } from "./index";

describe("equals rule", () => {
  it("should create equals rule with string value", () => {
    const rule = equals(v("admin"));

    expect(rule).toEqual({
      type: "equals",
      equals: v("admin"),
    });
  });

  it("should create equals rule with number value", () => {
    const rule = equals(v(42));

    expect(rule).toEqual({
      type: "equals",
      equals: v(42),
    });
  });

  it("should create equals rule with boolean value", () => {
    const rule = equals(v(true));

    expect(rule).toEqual({
      type: "equals",
      equals: v(true),
    });
  });

  it("should create equals rule with reference", () => {
    const reference = ref("confirmPassword");
    const rule = equals(reference);

    expect(rule).toEqual({
      type: "equals",
      equals: { type: REFERENCE_TYPE, path: "confirmPassword" },
    });
  });

  it("should create equals rule with cross-field reference", () => {
    const rule = equals(ref("$.user.expectedRole"));

    expect(rule).toEqual({
      type: "equals",
      equals: { type: REFERENCE_TYPE, path: "$.user.expectedRole" },
    });
  });

  it("should create equals rule with custom error code", () => {
    const rule = equals(v("admin"), "INVALID_ROLE");

    expect(rule).toEqual({
      type: "equals",
      equals: v("admin"),
      code: "INVALID_ROLE",
    });
  });
});

describe("equalsRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  it("should return undefined when value equals expected value", async () => {
    const rule = equals(v("admin"));

    const result = await equalsRule({
      rule,
      value: "admin",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value does not equal expected value", async () => {
    const rule = equals(v("admin"));

    const result = await equalsRule({
      rule,
      value: "user",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("equals");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("does not equal");
  });

  it("should handle number values correctly", async () => {
    const numberMockContext = {} as unknown as Context<NumberSchema>;
    const numberMockSchema = number();
    const rule = equals(v(42));

    const result = await equalsRule({
      rule,
      value: 42,
      path: "testPath",
      schema: numberMockSchema,
      context: numberMockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = equals(v("admin"));

    const result = await equalsRule({
      rule,
      value: "guest",
      path: "$.role",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.role");
    expect(result?.message).toContain("does not equal admin");
    expect(result?.code).toBe("equals");
  });
});
