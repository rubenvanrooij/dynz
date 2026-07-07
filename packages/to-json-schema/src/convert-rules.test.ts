import { ref, v } from "dynz";
import { describe, expect, it, vi } from "vitest";
import { applyRule } from "./convert-rules";
import type { JsonSchema } from "./types";

describe("applyRule", () => {
  it("maps min/max to minimum/maximum", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "min", min: v(5) }, "number", { errorMode: "ignore" });
    applyRule(jsonSchema, { type: "max", max: v(10) }, "number", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ minimum: 5, maximum: 10 });
  });

  it("maps min_length/max_length to minLength/maxLength", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "min_length", min: v(1) }, "string", { errorMode: "ignore" });
    applyRule(jsonSchema, { type: "max_length", max: v(50) }, "string", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ minLength: 1, maxLength: 50 });
  });

  it("maps min_length/max_length on an array schema to minItems/maxItems", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "min_length", min: v(1) }, "array", { errorMode: "ignore" });
    applyRule(jsonSchema, { type: "max_length", max: v(3) }, "array", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ minItems: 1, maxItems: 3 });
  });

  it("maps min_entries/max_entries (object key count) to minProperties/maxProperties", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "min_entries", min: v(1) }, "object", { errorMode: "ignore" });
    applyRule(jsonSchema, { type: "max_entries", max: v(3) }, "object", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ minProperties: 1, maxProperties: 3 });
  });

  it("maps max_precision to multipleOf", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "max_precision", maxPrecision: v(2) }, "number", { errorMode: "ignore" });

    expect(jsonSchema.multipleOf).toBeCloseTo(0.01);
  });

  it("maps regex to pattern", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "regex", regex: "^[a-z]+$" }, "string", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ pattern: "^[a-z]+$" });
  });

  it("warns when regex flags are set but still emits the pattern", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "regex", regex: "^[a-z]+$", flags: "i" }, "string", { errorMode: "warn" });

    expect(jsonSchema.pattern).toBe("^[a-z]+$");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("maps email to format", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "email" }, "string", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ format: "email" });
  });

  it("maps is_numeric to a numeric pattern", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "is_numeric" }, "string", { errorMode: "ignore" });

    expect(jsonSchema.pattern).toBe("^[+-]?\\d+(\\.\\d+)?$");
  });

  it("maps equals to const", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "equals", equals: v("admin") }, "string", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ const: "admin" });
  });

  it("maps includes on a string schema to pattern", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "includes", includes: v("foo") }, "string", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ pattern: "foo" });
  });

  it("maps includes on an array schema to contains", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "includes", includes: v("admin") }, "array", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ contains: { const: "admin" } });
  });

  it("maps not_includes to a negated pattern/contains", () => {
    const stringSchema: JsonSchema = {};
    applyRule(stringSchema, { type: "not_includes", notIncludes: v("foo") }, "string", { errorMode: "ignore" });
    expect(stringSchema).toEqual({ not: { pattern: "foo" } });

    const arraySchema: JsonSchema = {};
    applyRule(arraySchema, { type: "not_includes", notIncludes: v("admin") }, "array", { errorMode: "ignore" });
    expect(arraySchema).toEqual({ not: { contains: { const: "admin" } } });
  });

  it("maps one_of to enum when every value is static", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "one_of", values: [v("a"), v("b")] }, "string", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ enum: ["a", "b"] });
  });

  it("skips one_of entirely when any value is not static", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "one_of", values: [v("a"), ref("other")] }, "string", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({});
  });

  it("maps not_one_of to not/enum", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "not_one_of", values: [v(1), v(2)] }, "number", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ not: { enum: [1, 2] } });
  });

  it("maps a single static mime_type to contentMediaType", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "mime_type", mimeType: v("image/png") }, "file", { errorMode: "ignore" });

    expect(jsonSchema).toEqual({ contentMediaType: "image/png" });
  });

  it("skips mime_type with multiple values", () => {
    const jsonSchema: JsonSchema = {};
    applyRule(jsonSchema, { type: "mime_type", mimeType: v(["image/png", "image/jpeg"]) }, "file", {
      errorMode: "ignore",
    });

    expect(jsonSchema).toEqual({});
  });

  it("skips rules with no JSON Schema equivalent", () => {
    for (const rule of [
      { type: "min_date" as const, min: v(new Date()) },
      { type: "max_date" as const, max: v(new Date()) },
      { type: "before" as const, before: v(new Date()) },
      { type: "after" as const, after: v(new Date()) },
      { type: "min_size" as const, min: v(1) },
      { type: "max_size" as const, max: v(1) },
      { type: "custom" as const, name: "foo", params: {} },
      { type: "conditional" as const, cases: [] },
    ]) {
      const jsonSchema: JsonSchema = {};
      applyRule(jsonSchema, rule, "string", { errorMode: "ignore" });
      expect(jsonSchema).toEqual({});
    }
  });

  it("throws when errorMode is 'throw' and a rule value is not static", () => {
    expect(() => applyRule({}, { type: "min", min: ref("other") }, "number", { errorMode: "throw" })).toThrow();
  });

  it("does not throw or warn when errorMode is 'ignore'", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(() => applyRule({}, { type: "min", min: ref("other") }, "number", { errorMode: "ignore" })).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
