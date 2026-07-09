import { describe, expect, it } from "vitest";
import { eq, v } from "../../functions";
import { ref } from "../../reference";
import { object, string } from "..";
import { isDiscriminatorEnabled, isDiscriminator } from "./discriminator";
import { DISCRIMINATOR_TYPE, type Discriminator } from "./types";

const rootSchema = object({
  country: string(),
});

describe("isDiscriminator", () => {
  it("returns false for a regular Schema", () => {
    expect(isDiscriminator(string())).toBe(false);
  });

  it("returns true for a Discriminator", () => {
    expect(isDiscriminator({ type: DISCRIMINATOR_TYPE, value: "a" })).toBe(true);
    expect(isDiscriminator({ type: DISCRIMINATOR_TYPE, value: "a", enabled: eq(ref("country"), v("NL")) })).toBe(true);
  });
});

describe("isDiscriminatorEnabled", () => {
  it("is enabled when `enabled` is omitted", () => {
    const discriminator: Discriminator = { type: DISCRIMINATOR_TYPE, value: "a" };

    expect(isDiscriminatorEnabled(discriminator, "$", { schema: rootSchema, values: {} })).toBe(true);
  });

  it("resolves a static boolean enabled flag", () => {
    expect(
      isDiscriminatorEnabled({ type: DISCRIMINATOR_TYPE, value: "a", enabled: true }, "$", {
        schema: rootSchema,
        values: {},
      })
    ).toBe(true);
    expect(
      isDiscriminatorEnabled({ type: DISCRIMINATOR_TYPE, value: "a", enabled: false }, "$", {
        schema: rootSchema,
        values: {},
      })
    ).toBe(false);
  });

  it("resolves a predicate-based enabled flag against the given values", () => {
    const discriminator: Discriminator = {
      type: DISCRIMINATOR_TYPE,
      value: "a",
      enabled: eq(ref("country"), v("NL")),
    };

    expect(isDiscriminatorEnabled(discriminator, "$", { schema: rootSchema, values: { country: "NL" } })).toBe(true);
    expect(isDiscriminatorEnabled(discriminator, "$", { schema: rootSchema, values: { country: "BE" } })).toBe(false);
  });
});
