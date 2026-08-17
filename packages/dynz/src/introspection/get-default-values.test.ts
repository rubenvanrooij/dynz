import { describe, expect, it } from "vitest";
import { array, boolean, date, discriminatedUnion, literal, number, object, options, string } from "../schemas";
import { serialize } from "../serialize";
import { validate } from "../validate";
import { getDefaultValues } from "./get-default-values";

describe("getDefaultValues", () => {
  it("returns undefined for a scalar schema with no default", () => {
    expect(getDefaultValues(string())).toBeUndefined();
  });

  it("returns a scalar schema's own default", () => {
    expect(getDefaultValues(string().setDefault("Anonymous"))).toBe("Anonymous");
  });

  it("returns undefined for an object with no defaults anywhere inside it", () => {
    const schema = object({ name: string(), age: number() });

    expect(getDefaultValues(schema)).toBeUndefined();
  });

  it("fills in every field that has its own default, omitting the rest", () => {
    const schema = object({
      theme: options(["light", "dark"] as const).setDefault("light"),
      notifications: boolean().setDefault(true),
      name: string(),
    });

    expect(getDefaultValues(schema)).toEqual({ theme: "light", notifications: true });
  });

  it("surfaces a nested field's own default even when the containing object has none", () => {
    const schema = object({
      profile: object({
        bio: string().setDefault(""),
        avatarUrl: string(),
      }),
    });

    expect(getDefaultValues(schema)).toEqual({ profile: { bio: "" } });
  });

  it("uses the object's own default wholesale when it has one, per prefault semantics", () => {
    const schema = object({
      foo: string().setDefault("foo"),
      bar: string(),
    }).setDefault({});

    // The object's own default ({}) wins outright — matches withDefault, which this
    // reuses directly. Nested field defaults are a *fallback* used only when the
    // container has no default of its own (see the previous test).
    expect(getDefaultValues(schema)).toEqual({});
  });

  it("surfaces a literal's single possible value", () => {
    const schema = object({ kind: literal("invoice"), title: string() });

    expect(getDefaultValues(schema)).toEqual({ kind: "invoice" });
  });

  it("repairs a date nested inside a composite default after a serialize()/JSON.parse() round trip", () => {
    const original = object({
      meta: object({
        createdAt: date().setDefault(new Date("2024-01-01T00:00:00.000Z")),
      }),
    });
    const roundTripped = JSON.parse(serialize(original));

    const result = getDefaultValues(roundTripped) as { meta: { createdAt: Date } };

    expect(result.meta.createdAt).toBeInstanceOf(Date);
    expect(result.meta.createdAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  it("contributes nothing for an array with no default of its own, even if its item schema has one", () => {
    // There's no principled number of items to invent — a per-item default only fills
    // a gap in an array that already has entries, and this one has none.
    const schema = object({ tags: array(string().setDefault("n/a")) });

    expect(getDefaultValues(schema)).toBeUndefined();
  });

  it("returns an array's own default when it has one", () => {
    const schema = object({ tags: array(string()).setDefault(["a", "b"]) });

    expect(getDefaultValues(schema)).toEqual({ tags: ["a", "b"] });
  });

  it("contributes nothing for a discriminated union with no default of its own", () => {
    // Same reasoning as the array case: there's no principled member to pick without
    // a discriminator value to work from.
    const schema = object({
      contact: discriminatedUnion("type", [
        { type: "email", email: string().setDefault("a@b.com") },
        { type: "phone", phone: string() },
      ]),
      name: string().setDefault("Anonymous"),
    });

    expect(getDefaultValues(schema)).toEqual({ name: "Anonymous" });
  });

  it("returns a discriminated union's own default when it has one", () => {
    const schema = object({
      contact: discriminatedUnion("type", [
        { type: "email", email: string() },
        { type: "phone", phone: string() },
      ]).setDefault({ type: "email", email: "a@b.com" }),
    });

    expect(getDefaultValues(schema)).toEqual({ contact: { type: "email", email: "a@b.com" } });
  });

  it("uses a partial union default (just the discriminator) wholesale, same as object() — no merge here either", () => {
    // getDefaultValues doesn't run validate()'s recursion, only withDefault's own
    // resolution — so unlike a full validate() round trip (see validate.test.ts's
    // equivalent case), a member field's own default is *not* composed in here.
    const schema = object({
      contact: discriminatedUnion("type", [
        { type: "email", email: string().setDefault("default@b.com") },
        { type: "phone", phone: string() },
      ]).setDefault({ type: "email" }),
    });

    expect(getDefaultValues(schema)).toEqual({ contact: { type: "email" } });
  });

  it("produces a shape that validate() accepts as-is for every field it fills in", async () => {
    const schema = object({
      theme: options(["light", "dark"] as const).setDefault("light"),
      profile: object({ bio: string().setDefault("") }),
    });

    const defaults = getDefaultValues(schema);
    const result = await validate(schema, undefined, defaults);

    expect(result).toEqual({ success: true, values: { theme: "light", profile: { bio: "" } } });
  });
});
