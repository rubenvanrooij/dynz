import { describe, expect, it } from "vitest";
import { eq, v } from "../../functions";
import { ref } from "../../reference";
import type { Schema } from "../../types";
import { object, string } from "..";
import { getDiscriminatorLiteral, isDiscriminatorEnabled, isDynamicDiscriminatorValue } from "./resolve-member";

const rootSchema = object({
  country: string(),
  kind: string(),
});

describe("isDynamicDiscriminatorValue", () => {
  it("returns false for plain primitives", () => {
    expect(isDynamicDiscriminatorValue("a")).toBe(false);
    expect(isDynamicDiscriminatorValue(1)).toBe(false);
    expect(isDynamicDiscriminatorValue(true)).toBe(false);
  });

  it("returns false for a Schema (it has a type field)", () => {
    expect(isDynamicDiscriminatorValue(string() as Schema)).toBe(false);
  });

  it("returns true for a DynamicOptionValue", () => {
    expect(isDynamicDiscriminatorValue({ enabled: true, value: "a" })).toBe(true);
    expect(isDynamicDiscriminatorValue({ enabled: eq(ref("country"), v("NL")), value: "a" })).toBe(true);
  });
});

describe("getDiscriminatorLiteral", () => {
  it("returns plain primitives as-is", () => {
    expect(getDiscriminatorLiteral("a")).toBe("a");
    expect(getDiscriminatorLiteral(1)).toBe(1);
    expect(getDiscriminatorLiteral(false)).toBe(false);
  });

  it("unwraps a DynamicOptionValue to its literal value", () => {
    expect(getDiscriminatorLiteral({ enabled: true, value: "a" })).toBe("a");
    expect(getDiscriminatorLiteral({ enabled: false, value: 2 })).toBe(2);
  });
});

describe("isDiscriminatorEnabled", () => {
  it("is always enabled for plain primitives", () => {
    expect(isDiscriminatorEnabled("a", "$", { schema: rootSchema, values: {} })).toBe(true);
  });

  it("resolves a static boolean enabled flag", () => {
    expect(isDiscriminatorEnabled({ enabled: true, value: "a" }, "$", { schema: rootSchema, values: {} })).toBe(true);
    expect(isDiscriminatorEnabled({ enabled: false, value: "a" }, "$", { schema: rootSchema, values: {} })).toBe(false);
  });

  it("resolves a predicate-based enabled flag against the given values", () => {
    const entry = { enabled: eq(ref("country"), v("NL")), value: "a" };

    expect(isDiscriminatorEnabled(entry, "$", { schema: rootSchema, values: { country: "NL" } })).toBe(true);
    expect(isDiscriminatorEnabled(entry, "$", { schema: rootSchema, values: { country: "BE" } })).toBe(false);
  });
});
