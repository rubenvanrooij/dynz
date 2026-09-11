import { describe, expect, it } from "vitest";
import { eq } from "../functions";
import { ref } from "../reference";
import { array, discriminatedUnion, literal, number, object, string } from "../schemas";
import { SchemaType } from "../types";
import { getIncludedPaths } from "./get-included-paths";

describe("getIncludedPaths", () => {
  it("returns every field path for a plain object, all defaulting to required and mutable", () => {
    const schema = object({ name: string(), age: number() });

    expect(getIncludedPaths(schema, { name: "Alice", age: 30 })).toEqual([
      { path: "$.name", type: SchemaType.STRING, required: true, mutable: true },
      { path: "$.age", type: SchemaType.NUMBER, required: true, mutable: true },
    ]);
  });

  it("reflects an optional/immutable field's declared state", () => {
    const schema = object({
      name: string().optional(),
      id: string().setMutable(false),
    });

    expect(getIncludedPaths(schema, { name: "Alice", id: "1" })).toEqual([
      { path: "$.name", type: SchemaType.STRING, required: false, mutable: true },
      { path: "$.id", type: SchemaType.STRING, required: true, mutable: false },
    ]);
  });

  it("omits a field excluded by a condition", () => {
    const schema = object({
      plan: string(),
      note: string().setIncluded(eq(ref("plan"), "paid")),
    });

    expect(getIncludedPaths(schema, { plan: "free" })).toEqual([
      { path: "$.plan", type: SchemaType.STRING, required: true, mutable: true },
    ]);

    expect(getIncludedPaths(schema, { plan: "paid" })).toEqual([
      { path: "$.plan", type: SchemaType.STRING, required: true, mutable: true },
      { path: "$.note", type: SchemaType.STRING, required: true, mutable: true },
    ]);
  });

  it("emits a container path itself, alongside its descendants", () => {
    const schema = object({
      address: object({ street: string(), city: string() }),
    });

    expect(getIncludedPaths(schema, { address: { street: "Main St", city: "Springfield" } })).toEqual([
      { path: "$.address", type: SchemaType.OBJECT, required: true, mutable: true },
      { path: "$.address.street", type: SchemaType.STRING, required: true, mutable: true },
      { path: "$.address.city", type: SchemaType.STRING, required: true, mutable: true },
    ]);
  });

  it("discards every descendant when a container itself is excluded", () => {
    const schema = object({
      plan: string(),
      address: object({ street: string() }).setIncluded(eq(ref("plan"), "paid")),
    });

    expect(getIncludedPaths(schema, { plan: "free" })).toEqual([
      { path: "$.plan", type: SchemaType.STRING, required: true, mutable: true },
    ]);
  });

  it("walks array elements according to the actual number of items present", () => {
    const schema = object({ tags: array(string()) });

    expect(getIncludedPaths(schema, { tags: [] })).toEqual([
      { path: "$.tags", type: SchemaType.ARRAY, required: true, mutable: true },
    ]);

    expect(getIncludedPaths(schema, { tags: ["a", "b"] })).toEqual([
      { path: "$.tags", type: SchemaType.ARRAY, required: true, mutable: true },
      { path: "$.tags.[0]", type: SchemaType.STRING, required: true, mutable: true },
      { path: "$.tags.[1]", type: SchemaType.STRING, required: true, mutable: true },
    ]);
  });

  it("still emits a container path even when it holds no items to walk into", () => {
    const schema = object({ tags: array(string()).optional() });

    expect(getIncludedPaths(schema, {})).toEqual([
      { path: "$.tags", type: SchemaType.ARRAY, required: false, mutable: true },
    ]);
  });

  it("walks only the currently matching discriminated union member", () => {
    const schema = object({
      contact: discriminatedUnion("type", [
        { type: "email", email: string() },
        { type: "phone", phone: string() },
      ]),
    });

    expect(getIncludedPaths(schema, { contact: { type: "email", email: "a@b.com" } })).toEqual([
      { path: "$.contact", type: SchemaType.DISCRIMINATED_UNION, required: true, mutable: true },
      { path: "$.contact.email", type: SchemaType.STRING, required: true, mutable: true },
    ]);

    expect(getIncludedPaths(schema, { contact: { type: "phone", phone: "000" } })).toEqual([
      { path: "$.contact", type: SchemaType.DISCRIMINATED_UNION, required: true, mutable: true },
      { path: "$.contact.phone", type: SchemaType.STRING, required: true, mutable: true },
    ]);
  });

  it("emits the union path itself but nothing beyond it when no member matches", () => {
    const schema = object({
      contact: discriminatedUnion("type", [{ type: "email", email: string() }]),
    });

    expect(getIncludedPaths(schema, { contact: { type: "fax" } })).toEqual([
      { path: "$.contact", type: SchemaType.DISCRIMINATED_UNION, required: true, mutable: true },
    ]);
  });

  it("surfaces a literal field like any other leaf", () => {
    const schema = object({ kind: literal("invoice") });

    expect(getIncludedPaths(schema, { kind: "invoice" })).toEqual([
      { path: "$.kind", type: SchemaType.LITERAL, required: true, mutable: true },
    ]);
  });
});
