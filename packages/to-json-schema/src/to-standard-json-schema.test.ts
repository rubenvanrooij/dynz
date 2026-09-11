import { array, discriminatedUnion, eq, literal, number, object, ref, string, v } from "dynz";
import { describe, expect, it, vi } from "vitest";
import { toStandardJsonSchema } from "./to-standard-json-schema";

describe("toStandardJsonSchema", () => {
  it("defaults to strict mode: additionalProperties:false and every property required, non-mandatory ones widened to accept null", () => {
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
      additionalProperties: false,
      properties: {
        email: { type: "string", format: "email" },
        // "age" is optional, "promoCode" is only conditionally required (a Predicate) —
        // neither is statically mandatory, so both are widened to also accept null.
        age: { anyOf: [{ type: "number", minimum: 0, maximum: 150 }, { type: "null" }] },
        role: { type: "string", enum: ["admin", "member"] },
        promoCode: { anyOf: [{ type: "string" }, { type: "null" }] },
        tags: { type: "array", items: { type: "string" }, minItems: 0 },
      },
      required: ["email", "age", "role", "promoCode", "tags"],
    });
  });

  it("opts out of strict mode with strict: false, reproducing the pre-strict shape", () => {
    const schema = object({
      email: string().email(),
      age: number().min(0).max(150).optional(),
      role: string().oneOf([v("admin"), v("member")]),
      promoCode: string().setRequired(eq(ref("role"), v("admin"))),
      tags: array(string()).min(0),
    });

    expect(toStandardJsonSchema(schema, { strict: false })).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        age: { type: "number", minimum: 0, maximum: 150 },
        role: { type: "string", enum: ["admin", "member"] },
        promoCode: { type: "string" },
        tags: { type: "array", items: { type: "string" }, minItems: 0 },
      },
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
      additionalProperties: false,
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
      additionalProperties: false,
      properties: { name: { type: "string" }, fullName: {} },
      required: ["name", "fullName"],
    });
  });

  it("defaults to unionKeyword 'oneOf' for a discriminated union, honoring strict on each member", () => {
    const schema = discriminatedUnion("kind", [
      { kind: "email", value: string() },
      { kind: "phone", value: string() },
    ]);

    expect(toStandardJsonSchema(schema)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          properties: { kind: { const: "email", type: "string" }, value: { type: "string" } },
          required: ["kind", "value"],
        },
        {
          type: "object",
          additionalProperties: false,
          properties: { kind: { const: "phone", type: "string" }, value: { type: "string" } },
          required: ["kind", "value"],
        },
      ],
    });
  });

  it("switches to anyOf for a discriminated union when unionKeyword is 'anyOf'", () => {
    const schema = discriminatedUnion("kind", [
      { kind: "email", value: string() },
      { kind: "phone", value: string() },
    ]);

    const result = toStandardJsonSchema(schema, { unionKeyword: "anyOf" });

    expect(result.oneOf).toBeUndefined();
    expect(result.anyOf).toHaveLength(2);
  });

  it("infers type from a literal's value under strict mode", () => {
    expect(toStandardJsonSchema(literal("admin"))).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      const: "admin",
      type: "string",
    });
    expect(toStandardJsonSchema(literal(null))).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      const: null,
      type: "null",
    });
    expect(toStandardJsonSchema(literal("admin"), { strict: false })).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      const: "admin",
    });
  });
});
