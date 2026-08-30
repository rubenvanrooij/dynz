import type { Schema } from "dynz";
import {
  array,
  boolean,
  date,
  discriminatedUnion,
  eq,
  file,
  literal,
  number,
  object,
  options,
  ref,
  string,
  v,
} from "dynz";
import { describe, expect, it, vi } from "vitest";
import { convertSchema } from "./convert-schema";
import type { ConversionContext } from "./types";

const ctx: ConversionContext = { errorMode: "ignore", mode: "input" };

describe("convertSchema", () => {
  it("converts primitive schemas", () => {
    expect(convertSchema(string(), ctx)).toEqual({ type: "string" });
    expect(convertSchema(number(), ctx)).toEqual({ type: "number" });
    expect(convertSchema(boolean(), ctx)).toEqual({ type: "boolean" });
    expect(convertSchema(date(), ctx)).toEqual({ type: "string", format: "date-time" });
  });

  it("converts a literal schema, including null", () => {
    expect(convertSchema(literal("admin"), ctx)).toEqual({ const: "admin" });
    expect(convertSchema(literal(null), ctx)).toEqual({ const: null });
  });

  it("converts an enum schema", () => {
    const schema: Schema = { type: "enum", enum: { A: "a", B: "b" } };

    expect(convertSchema(schema, ctx)).toEqual({ type: "string", enum: ["a", "b"] });
  });

  it("converts an options schema, honoring statically enabled/disabled entries", () => {
    const schema: Schema = {
      type: "options",
      options: ["a", { enabled: true, value: "b" }, { enabled: false, value: "c" }],
    };

    expect(convertSchema(schema, ctx)).toEqual({ type: "string", enum: ["a", "b"] });
  });

  it("keeps a predicate-enabled option and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const schema: Schema = {
      type: "options",
      options: [{ enabled: eq(ref("type"), v("x")), value: "d" }],
    };

    expect(convertSchema(schema, { errorMode: "warn", mode: "input" })).toEqual({ type: "string", enum: ["d"] });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("converts a file schema with a static mime_type rule", () => {
    const schema = file().mimeType(v("image/png"));

    expect(convertSchema(schema, ctx)).toEqual({ type: "string", contentMediaType: "image/png" });
  });

  it("converts an expression schema to an unconstrained schema", () => {
    const schema: Schema = { type: "expression", value: v(1) };

    expect(convertSchema(schema, ctx)).toEqual({});
  });

  it("converts an array schema, applying items and entry-count rules", () => {
    const schema = array(string()).min(1).max(3);

    expect(convertSchema(schema, ctx)).toEqual({
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
    });
  });

  it("converts an object schema, marking only statically-mandatory fields as required", () => {
    const schema = object({
      name: string(),
      nickname: string().optional(),
      role: string().setRequired(eq(ref("type"), v("admin"))),
      conditional: string().setIncluded(eq(ref("type"), v("admin"))),
    });

    expect(convertSchema(schema, ctx)).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        nickname: { type: "string" },
        role: { type: "string" },
        conditional: { type: "string" },
      },
      required: ["name"],
    });
  });

  it("omits statically excluded fields entirely", () => {
    const schema = object({
      name: string(),
      hidden: string().setIncluded(false),
    });

    // dynz errors on any value present for an excluded field (or strips it), so emitting
    // it would describe a document the validator refuses.
    expect(convertSchema(schema, ctx)).toEqual({
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    });
  });

  it("omits statically excluded fields in 'output' mode too", () => {
    const schema = object({ name: string(), hidden: string().setIncluded(false) });

    expect(convertSchema(schema, { errorMode: "ignore", mode: "output" })).toEqual({
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    });
  });

  it("omits statically excluded fields from a discriminated union member", () => {
    const schema: Schema = {
      type: "discriminated_union",
      key: "kind",
      schemas: [{ kind: "a", value: string(), hidden: string().setIncluded(false) }],
    };

    expect(convertSchema(schema, ctx)).toEqual({
      oneOf: [
        {
          type: "object",
          properties: { kind: { const: "a" }, value: { type: "string" } },
          required: ["kind", "value"],
        },
      ],
    });
  });

  it("omits expression fields from an object in 'input' mode (default) but includes them in 'output' mode", () => {
    const schema = object({
      name: string(),
      computed: { type: "expression", value: v(1) },
    });

    expect(convertSchema(schema, { errorMode: "ignore", mode: "input" })).toEqual({
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    });

    expect(convertSchema(schema, { errorMode: "ignore", mode: "output" })).toEqual({
      type: "object",
      properties: { name: { type: "string" }, computed: {} },
      required: ["name", "computed"],
    });
  });

  it("omits expression fields from a discriminated union member in 'input' mode but includes them in 'output' mode", () => {
    const schema: Schema = {
      type: "discriminated_union",
      key: "kind",
      schemas: [{ kind: "a", value: string(), computed: { type: "expression", value: v(1) } }],
    };

    expect(convertSchema(schema, { errorMode: "ignore", mode: "input" })).toEqual({
      oneOf: [
        {
          type: "object",
          properties: { kind: { const: "a" }, value: { type: "string" } },
          required: ["kind", "value"],
        },
      ],
    });

    expect(convertSchema(schema, { errorMode: "ignore", mode: "output" })).toEqual({
      oneOf: [
        {
          type: "object",
          properties: { kind: { const: "a" }, value: { type: "string" }, computed: {} },
          required: ["kind", "value", "computed"],
        },
      ],
    });
  });

  it("converts a discriminated union to oneOf, dropping non-schema sibling entries", () => {
    // Built as a plain schema literal: the discriminatedUnion() fluent builder's CheckMember
    // constraint statically forbids non-schema sibling fields, but the underlying
    // DiscriminatedUnionSchema type still allows them (e.g. for dynamically constructed schemas).
    const schema: Schema = {
      type: "discriminated_union",
      key: "kind",
      schemas: [
        { kind: "a", value: string() },
        { kind: "b", value: number(), meta: "ignored" },
      ],
    };

    expect(convertSchema(schema, ctx)).toEqual({
      oneOf: [
        {
          type: "object",
          properties: { kind: { const: "a" }, value: { type: "string" } },
          required: ["kind", "value"],
        },
        {
          type: "object",
          properties: { kind: { const: "b" }, value: { type: "number" } },
          required: ["kind", "value"],
        },
      ],
    });
  });

  it("wraps private fields in the plain/masked shape", () => {
    const schema = string().setPrivate(true);

    expect(convertSchema(schema, ctx)).toEqual({
      oneOf: [
        {
          type: "object",
          properties: { state: { const: "plain" }, value: { type: "string" } },
          required: ["state"],
        },
        {
          type: "object",
          properties: { state: { const: "masked" }, value: { type: "string" } },
          required: ["state", "value"],
        },
      ],
    });
  });

  it("carries over a static default value", () => {
    expect(convertSchema(string().setDefault("hi"), ctx)).toEqual({ type: "string", default: "hi" });
  });

  it("serializes a Date default to an ISO string", () => {
    const defaultDate = new Date("2024-01-01T00:00:00.000Z");
    expect(convertSchema(date().setDefault(defaultDate), ctx)).toEqual({
      type: "string",
      format: "date-time",
      default: defaultDate.toISOString(),
    });
  });

  it("maps meta.title, meta.description and meta.deprecated onto the same-named JSON Schema keys", () => {
    const schema = string().setMeta({ title: "Name", description: "The user's name", deprecated: true });
    expect(convertSchema(schema, ctx)).toEqual({
      type: "string",
      title: "Name",
      description: "The user's name",
      deprecated: true,
    });
  });

  it("maps meta.id onto the JSON Schema $id keyword", () => {
    const schema = string().setMeta({ id: "userName" });
    expect(convertSchema(schema, ctx)).toEqual({ type: "string", $id: "userName" });
  });

  it("passes unknown custom meta keys through onto the JSON Schema output", () => {
    const schema = string().setMeta({ examples: ["Jane"] });
    expect(convertSchema(schema, ctx)).toEqual({ type: "string", examples: ["Jane"] });
  });

  it("does not list a defaulted field as required, even though dynz treats it as required by default", () => {
    // dynz now fills a static default in whenever a field is left empty, and that
    // default satisfies `required` there too — so listing the field as `required`
    // *and* handing it a `default` would tell every JSON Schema / OpenAPI consumer two
    // contradictory things at once.
    const schema = object({
      currency: options(["EUR", "USD"] as const).setDefault("EUR"),
      amount: number(),
    });

    expect(convertSchema(schema, ctx)).toEqual({
      type: "object",
      properties: {
        currency: { enum: ["EUR", "USD"], type: "string", default: "EUR" },
        amount: { type: "number" },
      },
      required: ["amount"],
    });
  });

  it("excludes a defaulted field from required even when .setRequired(true) was called explicitly", () => {
    // required: true (explicit) and required left unset both resolve identically at
    // validate() time — dynz has no way to tell "explicitly required" apart from
    // "required by default", so this stays consistent with the unset case above rather
    // than treating the explicit call as a stronger signal it isn't.
    const schema = object({
      currency: options(["EUR", "USD"] as const)
        .setRequired(true)
        .setDefault("EUR"),
    });

    expect(convertSchema(schema, ctx)).toEqual({
      type: "object",
      properties: {
        currency: { enum: ["EUR", "USD"], type: "string", default: "EUR" },
      },
    });
  });

  it("excludes a defaulted discriminated union from required and carries its default over", () => {
    // isMandatory excludes any schema with `default !== undefined` from `required`
    // generically, with no type-specific logic — this confirms that already covers
    // discriminatedUnion()'s .setDefault() with no changes needed on this side.
    const schema = object({
      contact: discriminatedUnion("kind", [
        { kind: "email", value: string() },
        { kind: "phone", value: string() },
      ]).setDefault({ kind: "email", value: "a@b.com" }),
    });

    expect(convertSchema(schema, ctx)).toEqual({
      type: "object",
      properties: {
        contact: {
          oneOf: [
            {
              type: "object",
              properties: { kind: { const: "email" }, value: { type: "string" } },
              required: ["kind", "value"],
            },
            {
              type: "object",
              properties: { kind: { const: "phone" }, value: { type: "string" } },
              required: ["kind", "value"],
            },
          ],
          default: { kind: "email", value: "a@b.com" },
        },
      },
    });
  });
});
