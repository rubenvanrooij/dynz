import { describe, expect, it } from "vitest";
import { createGlobals, GlobalType, global } from "../global";
import { ref } from "../reference";
import { object, string } from "../schemas";
import type { ResolveContext } from "../types";
import { SchemaType } from "../types";
import { v } from "./builders";
import { eq } from "./equals-function";
import { resolve } from "./resolve";

describe("resolve — global references", () => {
  it("resolves a global reference from context.globals", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: { today: "2026-01-01" },
    };

    const result = resolve(global("today", GlobalType.STRING), "$", context);

    expect(result).toBe("2026-01-01");
  });

  it("resolves a global whose value is explicitly undefined (present, just empty)", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: { today: undefined },
    };

    const result = resolve(global("today", GlobalType.DATE), "$", context);

    expect(result).toBeUndefined();
  });

  it("throws when a global key isn't in the globals map", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: {},
    };

    expect(() => resolve(global("missing", GlobalType.STRING), "$", context)).toThrow(
      /Global variable "missing" could not be found/
    );
  });

  it("throws when context.globals is omitted entirely", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
    };

    expect(() => resolve(global("today", GlobalType.DATE), "$", context)).toThrow(
      /Global variable "today" could not be found/
    );
  });

  it("does not resolve inherited Object.prototype properties as globals", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: {},
    };

    expect(() => resolve(global("toString", GlobalType.STRING), "$", context)).toThrow(
      /Global variable "toString" could not be found/
    );
  });

  it("resolves a ref() to a field whose own `included` predicate depends on a global", () => {
    // Regression test for unpackRef's internal `included` check: it must forward the
    // caller's full context (including globals) instead of rebuilding a bare one.
    const rootSchema = object({
      gated: string().setIncluded(eq(global("betaEnabled", GlobalType.BOOLEAN), v(true))),
    });

    const enabledContext: ResolveContext = {
      schema: rootSchema,
      values: { gated: "value" },
      globals: { betaEnabled: true },
    };
    expect(resolve(ref("$.gated"), "$", enabledContext)).toBe("value");

    const disabledContext: ResolveContext = {
      schema: rootSchema,
      values: { gated: "value" },
      globals: { betaEnabled: false },
    };
    expect(resolve(ref("$.gated"), "$", disabledContext)).toBeUndefined();
  });
});

describe("resolve — typed global references (createGlobals)", () => {
  const { global: typedGlobal } = createGlobals({ minAmount: SchemaType.NUMBER, now: SchemaType.DATE });

  it("resolves a typed global whose supplied value already matches", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: { minAmount: 10 },
    };

    expect(resolve(typedGlobal("minAmount"), "$", context)).toBe(10);
  });

  it("does not coerce the supplied value - a numeric string is rejected for a number global", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      // Supplied as a numeric string - e.g. it came from a query param or form field.
      // Unlike ref(), globals are not coerced: the caller must supply the exact type.
      globals: { minAmount: "10" },
    };

    expect(() => resolve(typedGlobal("minAmount"), "$", context)).toThrow(
      /Global variable "minAmount" was declared as "number"/
    );
  });

  it("throws a clear error when the supplied value doesn't match the declared type", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: { minAmount: "not-a-number" },
    };

    expect(() => resolve(typedGlobal("minAmount"), "$", context)).toThrow(
      /Global variable "minAmount" was declared as "number"/
    );
  });

  it("passes an explicitly undefined value through without type-checking it", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: { minAmount: undefined },
    };

    expect(resolve(typedGlobal("minAmount"), "$", context)).toBeUndefined();
  });

  it("still throws when a typed global key is missing entirely", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: {},
    };

    expect(() => resolve(typedGlobal("minAmount"), "$", context)).toThrow(
      /Global variable "minAmount" could not be found/
    );
  });
});
