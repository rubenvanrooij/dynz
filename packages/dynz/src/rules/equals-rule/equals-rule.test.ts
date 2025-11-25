import { beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENCE_TYPE, ref, unpackRef } from "../../reference";
import { type DateSchema, type DateStringSchema, date, dateString, type StringSchema, string } from "../../schemas";
import type { Context } from "../../types";
import { parseDateString } from "../../validate/validate-type";
import { getDateFromDateOrDateStringRefeference } from "../utils/reference";
import { equals, equalsDateRule, equalsDateStringRule, equalsRule } from "./index";

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

vi.mock("../utils/reference", () => ({
  getDateFromDateOrDateStringRefeference: vi.fn(),
}));

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

    vi.mocked(unpackRef).mockReturnValue({ value: "admin", static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: "admin", static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: 42, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: "secret123", static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: "admin", static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: equalDate, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: differentDate, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: undefined, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: equalDate, static: true } as ReturnType<typeof unpackRef>);

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

    vi.mocked(unpackRef).mockReturnValue({ value: differentDate, static: true } as ReturnType<typeof unpackRef>);

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

describe("equalsDateRule cross-type validation", () => {
  const testDate = new Date("2024-06-15");
  const mockContext = {} as unknown as Context<DateSchema>;
  const mockSchema = date();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate Date field against DateString reference", () => {
    const rule = equals(ref("dateStringField"));
    const referencedDate = new Date("2024-06-15");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-06-15",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = equalsDateRule({
      rule,
      schema: mockSchema,
      value: testDate,
      path: "dateField",
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.equals, "dateField", mockContext, "date", "date_string");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: "2024-06-15",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    expect(result).toBeUndefined(); // Equal dates should pass
  });

  it("should return error when Date field does not equal DateString reference", () => {
    const rule = equals(ref("dateStringField"));
    const referencedDate = new Date("2024-01-01");
    const differentTestDate = new Date("2024-12-31");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-01-01",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = equalsDateRule({
      rule,
      schema: mockSchema,
      value: differentTestDate,
      path: "dateField",
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("equals");
    expect(result?.equals).toBe("2024-01-01"); // Should use original reference value
    expect(result?.message).toContain("dateField");
    expect(result?.message).toContain("does not equal");
  });

  it("should handle undefined reference values", () => {
    const rule = equals(ref("nonExistentField"));

    vi.mocked(unpackRef).mockReturnValue({
      value: undefined,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(undefined);

    const result = equalsDateRule({
      rule,
      schema: mockSchema,
      value: testDate,
      path: "dateField",
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Should return undefined when reference is undefined
  });
});

describe("equalsDateStringRule cross-type validation", () => {
  const mockContext = {} as unknown as Context<DateStringSchema>;
  const mockSchema = dateString({ format: "yyyy-MM-dd" });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should validate DateString field against Date reference", () => {
    const rule = equals(ref("dateField"));
    // Use parseDateString to create the matching date that the function will compare against
    const parsedDate = parseDateString("2024-06-15", "yyyy-MM-dd");
    const referencedDate = parsedDate;

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = equalsDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(unpackRef).toHaveBeenCalledWith(rule.equals, "dateStringField", mockContext, "date", "date_string");
    expect(getDateFromDateOrDateStringRefeference).toHaveBeenCalledWith({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    expect(result).toBeUndefined(); // Equal dates should pass
  });

  it("should validate DateString field against DateString reference", () => {
    const rule = equals(ref("otherDateStringField"));
    // Use parseDateString to create the date that will be used for comparison
    const referencedDate = parseDateString("2024-06-15", "yyyy-MM-dd");

    vi.mocked(unpackRef).mockReturnValue({
      value: "2024-06-15",
      schema: { type: "date_string", format: "yyyy-MM-dd" },
      type: "date_string",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = equalsDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Equal date strings should pass
  });

  it("should return error when DateString field does not equal Date reference", () => {
    const rule = equals(ref("dateField"));
    const referencedDate = new Date("2024-01-01");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = equalsDateStringRule({
      rule,
      value: "2024-12-31",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeDefined();
    expect(result?.code).toBe("equals");
    expect(result?.equals).toBe(referencedDate); // Should use original reference value
    expect(result?.message).toContain("dateStringField");
    expect(result?.message).toContain("does not equal");
  });

  it("should handle undefined reference values", () => {
    const rule = equals(ref("nonExistentField"));

    vi.mocked(unpackRef).mockReturnValue({
      value: undefined,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(undefined);

    const result = equalsDateStringRule({
      rule,
      value: "2024-06-15",
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    expect(result).toBeUndefined(); // Should return undefined when reference is undefined
  });

  it("should handle time precision differences correctly", () => {
    const rule = equals(ref("dateField"));
    // Date with time information
    const referencedDate = new Date("2024-06-15T14:30:45.123Z");

    vi.mocked(unpackRef).mockReturnValue({
      value: referencedDate,
      schema: { type: "date" },
      type: "date",
      static: false,
    });
    vi.mocked(getDateFromDateOrDateStringRefeference).mockReturnValue(referencedDate);

    const result = equalsDateStringRule({
      rule,
      value: "2024-06-15", // Date string without time
      path: "dateStringField",
      schema: mockSchema,
      context: mockContext,
    });

    // This should fail because date with time !== date without time
    expect(result).toBeDefined();
    expect(result?.code).toBe("equals");
  });
});
