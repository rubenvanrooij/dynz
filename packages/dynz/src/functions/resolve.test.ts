import { describe, expect, it } from "vitest";
import { global } from "../global";
import { ref } from "../reference";
import { object, string } from "../schemas";
import type { ResolveContext } from "../types";
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

    const result = resolve(global("today"), "$", context);

    expect(result).toBe("2026-01-01");
  });

  it("resolves a global whose value is explicitly undefined (present, just empty)", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: { today: undefined },
    };

    const result = resolve(global("today"), "$", context);

    expect(result).toBeUndefined();
  });

  it("throws when a global key isn't in the globals map", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: {},
    };

    expect(() => resolve(global("missing"), "$", context)).toThrow(/Global variable "missing" could not be found/);
  });

  it("throws when context.globals is omitted entirely", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
    };

    expect(() => resolve(global("today"), "$", context)).toThrow(/Global variable "today" could not be found/);
  });

  it("does not resolve inherited Object.prototype properties as globals", () => {
    const schema = string();
    const context: ResolveContext = {
      schema,
      values: "hello",
      globals: {},
    };

    expect(() => resolve(global("toString"), "$", context)).toThrow(/Global variable "toString" could not be found/);
  });

  it("resolves a ref() to a field whose own `included` predicate depends on a global", () => {
    // Regression test for unpackRef's internal `included` check: it must forward the
    // caller's full context (including globals) instead of rebuilding a bare one.
    const rootSchema = object({
      gated: string().setIncluded(eq(global("betaEnabled"), v(true))),
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
