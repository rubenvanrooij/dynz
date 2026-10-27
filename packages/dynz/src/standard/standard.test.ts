import { describe, expect, expectTypeOf, it } from "vitest";
import { array, discriminatedUnion, number, object, string } from "../schemas";
import { serialize } from "../serialize";
import { type Schema, SchemaType, type SchemaValues } from "../types";
import { standardSchema } from "./standard";
import type { StandardSchemaV1 } from "./types";

describe("fluent builders", () => {
  it("expose ~standard on every schema, including nested and primitive roots", () => {
    const field = string().min(3);
    const schema = object({ name: field });

    for (const s of [schema, field, number()]) {
      expect(s["~standard"].version).toBe(1);
      expect(s["~standard"].vendor).toBe("dynz");
      expect(typeof s["~standard"].validate).toBe("function");
    }
  });

  it("keeps ~standard after chaining", async () => {
    const schema = string().min(3).optional();

    expect(await schema["~standard"].validate("ab")).toEqual({
      issues: [{ message: expect.any(String), path: [] }],
    });
  });

  it("returns the validated value, with defaults applied", async () => {
    const schema = object({
      name: string(),
      role: string().optional().setDefault("member"),
    });

    expect(await schema["~standard"].validate({ name: "Ada" })).toEqual({
      value: { name: "Ada", role: "member" },
    });
  });

  it("reports issues with path segments for objects and array indices", async () => {
    const schema = object({
      address: object({ zip: string().min(4) }),
      tags: array(string().min(2)),
    });

    const result = await schema["~standard"].validate({ address: { zip: "1" }, tags: ["ok", "a"] });

    expect(result.issues?.map((issue) => issue.path)).toEqual([
      ["address", "zip"],
      ["tags", 1],
    ]);
  });

  it("reports issues inside the matching discriminated union member", async () => {
    const schema = object({
      contact: discriminatedUnion("type", [
        { type: "email", email: string().email() },
        { type: "phone", phone: string() },
      ]),
    });

    const result = await schema["~standard"].validate({ contact: { type: "email", email: "nope" } });

    expect(result.issues?.map((issue) => issue.path)).toEqual([["contact", "email"]]);
  });

  it("does not leak ~standard into serialize or spreads", () => {
    const schema = object({ name: string() });

    expect(serialize(schema)).not.toContain("~standard");
    expect("~standard" in { ...schema }).toBe(false);
  });

  it("infers the output type from the schema", () => {
    const schema = object({ name: string(), age: number().optional() });

    expectTypeOf<StandardSchemaV1.InferOutput<typeof schema>>().toEqualTypeOf<SchemaValues<typeof schema>>();
    expectTypeOf(schema).toExtend<StandardSchemaV1>();
  });
});

describe("standardSchema", () => {
  it("upgrades a plain object schema without mutating it", async () => {
    const plain = { type: SchemaType.OBJECT, fields: { name: { type: SchemaType.STRING } } } satisfies Schema;

    const schema = standardSchema(plain);

    expect("~standard" in plain).toBe(false);
    expect(await schema["~standard"].validate({ name: "Ada" })).toEqual({ value: { name: "Ada" } });
    expect(await schema["~standard"].validate({ name: 1 })).toEqual({
      issues: [{ message: expect.any(String), path: ["name"] }],
    });
  });

  it("works on a deserialized schema", async () => {
    const schema = standardSchema(JSON.parse(serialize(object({ name: string().min(3) }))) as Schema);

    const result = await schema["~standard"].validate({ name: "a" });

    expect(result.issues?.[0]?.path).toEqual(["name"]);
  });

  it("enforces mutability when current values are supplied", async () => {
    const schema = object({ slug: string().setMutable(false) });

    const withCurrent = standardSchema(schema, { currentValues: { slug: "acme" } });

    expect((await withCurrent["~standard"].validate({ slug: "changed" })).issues).toHaveLength(1);
    expect(await schema["~standard"].validate({ slug: "changed" })).toEqual({ value: { slug: "changed" } });
  });

  it("forwards custom rules and the message transformer", async () => {
    const schema = standardSchema(object({ code: string().custom("isAcme") }), {
      customRules: { isAcme: ({ value }) => value === "acme" },
      messageTransformer: (error) => `translated:${error.code}`,
    });

    expect(await schema["~standard"].validate({ code: "acme" })).toEqual({ value: { code: "acme" } });
    expect(await schema["~standard"].validate({ code: "other" })).toEqual({
      issues: [{ message: "translated:custom", path: ["code"] }],
    });
  });
});
