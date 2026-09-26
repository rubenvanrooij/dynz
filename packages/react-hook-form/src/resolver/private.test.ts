import { maskPrivateValues, number, object, string, toFormValues } from "dynz";
import type { ResolverOptions } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { dynzResolver } from "./index";

vi.mock("@hookform/resolvers", () => ({
  toNestErrors: vi.fn((errors, _) => errors),
  validateFieldsNatively: vi.fn(),
}));

const options: ResolverOptions<Record<string, unknown>> = {
  names: [],
  fields: {},
  criteriaMode: "firstError",
  shouldUseNativeValidation: false,
};

describe("dynzResolver — private fields", () => {
  const schema = object({ name: string(), pin: number().setPrivate(true).min(1000) });
  const payload = maskPrivateValues(schema, { name: "Ada", pin: 1234 });
  const form = toFormValues(schema, payload) as { name: string; pin: unknown };

  it("submits an untouched private field as its mask marker without validating it", async () => {
    const result = await dynzResolver(schema, payload)(form, undefined, options);

    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ name: "Ada", pin: { state: "masked", value: "***" } });
  });

  it("validates and submits an edited private field as a plain value", async () => {
    const valid = await dynzResolver(schema, payload)({ ...form, pin: 5678 }, undefined, options);
    expect(valid.values).toEqual({ name: "Ada", pin: 5678 });

    const invalid = await dynzResolver(schema, payload)({ ...form, pin: 12 }, undefined, options);
    expect(invalid.errors).toHaveProperty("pin");
  });
});
