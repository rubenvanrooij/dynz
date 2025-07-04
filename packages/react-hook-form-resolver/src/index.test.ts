import { boolean, min, number, object, regex, string } from "dynz";
import { describe, expect, it, vi } from "vitest";
import { dynzResolver } from "./index";

// Mock react-hook-form dependencies
vi.mock("@hookform/resolvers", () => ({
  toNestErrors: vi.fn((errors, _) => errors),
  validateFieldsNatively: vi.fn(),
}));

describe("dynzResolver", () => {
  it("should return success for valid simple string schema", async () => {
    const schema = object({
      fields: {
        fieldOne: string(),
        fieldTwo: number(),
        fieldThree: boolean(),
      },
    });
    const resolver = dynzResolver(schema);

    const result = await resolver(
      {
        fieldOne: "string",
        fieldTwo: 1,
        fieldThree: false,
      },
      undefined,
      {
        names: ["fieldOne", "fieldTwo", "fieldThree"],
        fields: {},
        criteriaMode: "firstError",
        shouldUseNativeValidation: false,
      }
    );

    expect(result.errors).toEqual({});
    expect(result.values).toEqual({
      fieldOne: "string",
      fieldThree: false,
      fieldTwo: 1,
    });
  });

  it("should return only the first errors by default", async () => {
    const schema = object({
      fields: {
        value: string({
          required: true,
          rules: [min(10), regex("^[A-Z]")],
        }),
      },
    });
    const resolver = dynzResolver(schema);

    const result = await resolver({ value: "hi" }, undefined, {
      names: ["value"],
      fields: {},
      criteriaMode: "firstError",
      shouldUseNativeValidation: false,
    });

    expect(result.errors).toBeDefined();
    expect(result.values).toEqual({});
    // Should only have one error (the first one encountered)
    expect(Object.keys(result.errors).length).toBe(1);
  });

  it("should return all errors when criteriaMode is set to all", async () => {
    const schema = object({
      fields: {
        value: string({
          required: true,
          rules: [min(10), regex("^[A-Z]")],
        }),
      },
    });
    const resolver = dynzResolver(schema);

    const result = await resolver({ value: "hi" }, undefined, {
      names: ["value"],
      fields: {},
      criteriaMode: "all",
      shouldUseNativeValidation: false,
    });

    expect(result.errors).toBeDefined();
    expect(result.values).toEqual({});
    // Should only have one error (the first one encountered)
    expect(Object.keys(result.errors).length).toBe(1);
  });
});
