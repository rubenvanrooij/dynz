import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, date, type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { equals, equalsDateRule, equalsRule } from "./index";

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

describe("equals rule", () => {
  it("should create equals rule with string value", () => {
    const rule = equals("admin");

    expect(rule).toEqual({
      type: "equals",
      equals: "admin",
    });
  });

  it("should create equals rule with number value", () => {
    const rule = equals(42);

    expect(rule).toEqual({
      type: "equals",
      equals: 42,
    });
  });

  it("should create equals rule with boolean value", () => {
    const rule = equals(true);

    expect(rule).toEqual({
      type: "equals",
      equals: true,
    });
  });

  it("should create equals rule with reference", () => {
    const reference = ref("confirmPassword");
    const rule = equals(reference);

    expect(rule).toEqual({
      type: "equals",
      equals: {
        _type: REFERENCE_TYPE,
        path: "confirmPassword",
      },
    });
  });

  it("should create equals rule with cross-field reference", () => {
    const rule = equals(ref("$.user.expectedRole"));

    expect(rule).toEqual({
      type: "equals",
      equals: {
        _type: REFERENCE_TYPE,
        path: "$.user.expectedRole",
      },
    });
  });

  it("should create equals rule with array value", () => {
    const rule = equals(["admin", "user"]);

    expect(rule).toEqual({
      type: "equals",
      equals: ["admin", "user"],
    });
  });

  it("should create equals rule with custom error code", () => {
    const rule = equals("admin", "INVALID_ROLE");

    expect(rule).toEqual({
      type: "equals",
      equals: "admin",
      code: "INVALID_ROLE",
    });
  });
});

describe("equalsRule validator", () => {
  const mockContext = {} as unknown as Context<StringSchema>;
  const mockSchema = string();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when value equals expected value", async () => {
    const rule = equals("admin");

    vi.mocked(unpackRef).mockReturnValue({ value: "admin" } as ReturnType<typeof unpackRef>);

    const result = equalsRule({
      rule,
      value: "admin",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when value does not equal expected value", async () => {
    const rule = equals("admin");

    vi.mocked(unpackRef).mockReturnValue({ value: "admin" } as ReturnType<typeof unpackRef>);

    const result = equalsRule({
      rule,
      value: "user",
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("equals");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("does not equal");
  });

  it("should handle number values correctly", async () => {
    const rule = equals(42);

    vi.mocked(unpackRef).mockReturnValue({ value: 42 } as ReturnType<typeof unpackRef>);

    const result = equalsRule({
      rule,
      value: 42,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = equals(ref("confirmPassword"));

    vi.mocked(unpackRef).mockReturnValue({ value: "secret123" } as ReturnType<typeof unpackRef>);

    const result = equalsRule({
      rule,
      value: "secret123",
      path: "password",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = equals("admin");

    vi.mocked(unpackRef).mockReturnValue({ value: "admin" } as ReturnType<typeof unpackRef>);

    const result = equalsRule({
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

describe("equalsDateRule validator", () => {
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();
  const testDate = new Date("2024-01-01");
  const equalDate = new Date("2024-01-01");
  const differentDate = new Date("2024-01-02");

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined when date equals expected date", async () => {
    const rule = equals(equalDate);

    vi.mocked(unpackRef).mockReturnValue({ value: equalDate } as ReturnType<typeof unpackRef>);

    const result = equalsDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should return error when date does not equal expected date", async () => {
    const rule = equals(differentDate);

    vi.mocked(unpackRef).mockReturnValue({ value: differentDate } as ReturnType<typeof unpackRef>);

    const result = equalsDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result?.code).toBe("equals");
    expect(result?.message).toContain("testPath");
    expect(result?.message).toContain("does not equal");
  });

  it("should return undefined when unpackRef returns undefined", async () => {
    const rule = equals(testDate);

    vi.mocked(unpackRef).mockReturnValue({ value: undefined } as ReturnType<typeof unpackRef>);

    const result = equalsDateRule({
      rule,
      value: testDate,
      path: "testPath",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should handle reference objects correctly", async () => {
    const rule = equals(ref("targetDate"));

    vi.mocked(unpackRef).mockReturnValue({ value: equalDate } as ReturnType<typeof unpackRef>);

    const result = equalsDateRule({
      rule,
      value: testDate,
      path: "currentDate",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined();
  });

  it("should include correct error message format", async () => {
    const rule = equals(differentDate);

    vi.mocked(unpackRef).mockReturnValue({ value: differentDate } as ReturnType<typeof unpackRef>);

    const result = equalsDateRule({
      rule,
      value: testDate,
      path: "$.birthday",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result?.message).toContain("$.birthday");
    expect(result?.message).toContain("does not equal");
    expect(result?.code).toBe("equals");
  });
});
