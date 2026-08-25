import { array, eq, number, object, ref, string, v } from "dynz";
import { describe, expect, it, vi } from "vitest";
import { toStandardJsonSchema } from "./to-standard-json-schema";

describe("toStandardJsonSchema", () => {
  it("converts a realistic object schema end-to-end", () => {
    const schema = object({
      email: string().email(),
      age: number().min(0).max(150).optional(),
      role: string().oneOf([v("admin"), v("member")]),
      promoCode: string().setRequired(eq(ref("role"), v("admin"))),
      tags: array(string()).min(0),
    });

    expect(toStandardJsonSchema(schema)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        age: { type: "number", minimum: 0, maximum: 150 },
        role: { type: "string", enum: ["admin", "member"] },
        promoCode: { type: "string" },
        tags: { type: "array", items: { type: "string" }, minItems: 0 },
      },
      // "age" is optional, "promoCode" is only conditionally required (a Predicate),
      // so neither is statically mandatory.
      required: ["email", "role", "tags"],
    });
  });

  it("defaults to errorMode 'warn' for unresolvable rule values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const schema = string().min(ref("minLength"));

    expect(toStandardJsonSchema(schema)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "string",
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("throws when errorMode is 'throw' and a rule value is unresolvable", () => {
    const schema = string().min(ref("minLength"));

    expect(() => toStandardJsonSchema(schema, { errorMode: "throw" })).toThrow();
  });

  it("defaults to mode 'input', omitting expression fields", () => {
    const schema = object({
      name: string(),
      fullName: { type: "expression", value: v(1) },
    });

    expect(toStandardJsonSchema(schema)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    });
  });

  it("includes expression fields when mode is 'output'", () => {
    const schema = object({
      name: string(),
      fullName: { type: "expression", value: v(1) },
    });

    expect(toStandardJsonSchema(schema, { mode: "output" })).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: { name: { type: "string" }, fullName: {} },
      required: ["name", "fullName"],
    });
  });
});
