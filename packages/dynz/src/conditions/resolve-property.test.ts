import { describe, expect, it } from "vitest";
import { v } from "../functions";
import { eq } from "../functions/equals-function";
import { ref } from "../reference";
import { discriminatedUnion, object, string } from "../schemas";
import type { ResolveContext } from "../types";
import { resolveProperty } from "./resolve-property";

describe("resolveProperty", () => {
  it("should return default value when property is undefined", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
    };

    const result = resolveProperty("required", "$", true, context);

    expect(result).toBe(true);
  });

  it("should return false default value when property is undefined", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
    };

    const result = resolveProperty("required", "$", false, context);

    expect(result).toBe(false);
  });

  it("should return boolean value when property is false", () => {
    const schema = string().optional();
    const context: ResolveContext = {
      schema,
      values: "hello",
    };

    const result = resolveProperty("required", "$", true, context);

    expect(result).toBe(false);
  });

  it("should return boolean value when property is true", () => {
    const schema = string().setRequired(true);
    const context: ResolveContext = {
      schema,
      values: "hello",
    };

    const result = resolveProperty("required", "$", false, context);

    expect(result).toBe(true);
  });

  it("should resolve condition when property is a predicate - nested path", () => {
    const rootSchema = object({
      name: string().setRequired(eq(ref("$.status"), v("active"))),
      status: string(),
    });
    const context: ResolveContext = {
      schema: rootSchema,
      values: { status: "active", name: "John" },
    };

    const result = resolveProperty("required", "$.name", true, context);

    expect(result).toBe(true);
  });

  it("should return false when mutable property is false", () => {
    const schema = string().setMutable(false);
    const context: ResolveContext = {
      schema,
      values: "hello",
    };

    const result = resolveProperty("mutable", "$", true, context);

    expect(result).toBe(false);
  });

  it("should return true when included property is undefined (default)", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
    };

    const result = resolveProperty("included", "$", true, context);

    expect(result).toBe(true);
  });

  describe("paths through a discriminated union", () => {
    const schema = object({
      payment: discriminatedUnion("method", [
        { method: "card", card: string(), holder: string() },
        { method: "iban", iban: string(), holder: object({ name: string() }) },
      ]),
    });
    const resolveIncluded = (path: string, values: unknown) =>
      resolveProperty("included", path, true, { schema, values });

    it("is not included when the active member declares a parent of the path as a leaf", () => {
      expect(resolveIncluded("$.payment.holder.name", { payment: { method: "card", holder: "Jan" } })).toBe(false);
      expect(resolveIncluded("$.payment.holder.name", { payment: { method: "card" } })).toBe(false);
    });

    it("is included when the member declaring the path is active", () => {
      expect(resolveIncluded("$.payment.holder.name", { payment: { method: "iban", holder: { name: "Jan" } } })).toBe(
        true
      );
    });

    it("is not included when the union is absent", () => {
      expect(resolveIncluded("$.payment.holder.name", {})).toBe(false);
    });

    it("is not included for a path no member declares", () => {
      expect(resolveIncluded("$.payment.doesNotExist", { payment: { method: "card" } })).toBe(false);
    });
  });
});
