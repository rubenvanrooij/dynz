import { describe, expect, it } from "vitest";
import { array, date, discriminatedUnion, object, string } from "../schemas";
import type { Schema } from "../types";
import { SchemaType } from "../types";
import { withDefault } from "./with-default";

describe("withDefault", () => {
  describe("when a value is present", () => {
    it("returns the value unchanged, ignoring any default", () => {
      const schema = { type: SchemaType.STRING, default: "fallback" };

      expect(withDefault(schema, "actual")).toBe("actual");
    });

    it("does not treat falsy-but-defined values as absent", () => {
      expect(withDefault({ type: SchemaType.NUMBER, default: 42 }, 0)).toBe(0);
      expect(withDefault({ type: SchemaType.STRING, default: "fallback" }, "")).toBe("");
      expect(withDefault({ type: SchemaType.BOOLEAN, default: true }, false)).toBe(false);
    });
  });

  describe("when the value is undefined or null", () => {
    it("passes the value through unchanged when there is no default", () => {
      // No normalization needed here: everything downstream (required, type checks)
      // already treats undefined and null identically as "absent".
      const schema = { type: SchemaType.STRING };

      expect(withDefault(schema, undefined)).toBeUndefined();
      expect(withDefault(schema, null)).toBeNull();
    });

    it("returns the default when the value is undefined", () => {
      const schema = { type: SchemaType.STRING, default: "fallback" };

      expect(withDefault(schema, undefined)).toBe("fallback");
    });

    it("returns the default when the value is null", () => {
      const schema = { type: SchemaType.STRING, default: "fallback" };

      expect(withDefault(schema, null)).toBe("fallback");
    });
  });

  describe("date coercion — the one type whose default can legitimately need repairing", () => {
    it("coerces an ISO string default back into a Date — the shape a Date default takes after serialize() + JSON.parse()", () => {
      const schema = { type: SchemaType.DATE, default: "2024-01-01T00:00:00.000Z" } as unknown as Schema;

      const result = withDefault(schema, undefined);

      expect(result).toBeInstanceOf(Date);
      expect((result as Date).toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });

    it("leaves an already-correctly-typed Date default alone", () => {
      const date = new Date("2024-01-01T00:00:00.000Z");
      const schema = { type: SchemaType.DATE, default: date };

      expect(withDefault(schema, undefined)).toBe(date);
    });
  });

  describe("every other schema type — a mismatched default is left alone, not coerced", () => {
    it("does not coerce a string default on a number schema", () => {
      // Unlike Date, a number survives JSON round-tripping unchanged — a string here
      // means the schema was authored wrong, not that anything needs repairing. Passing
      // it through lets the normal type check catch the mistake instead of masking it.
      const schema = { type: SchemaType.NUMBER, default: "42" } as unknown as Schema;

      expect(withDefault(schema, undefined)).toBe("42");
    });

    it("does not coerce a numeric-looking string default on a boolean schema", () => {
      const schema = { type: SchemaType.BOOLEAN, default: "true" } as unknown as Schema;

      expect(withDefault(schema, undefined)).toBe("true");
    });

    it("does not coerce a real, caller-supplied value — only a substituted default", () => {
      const schema = { type: SchemaType.NUMBER, default: 1 };

      expect(withDefault(schema, "not a number")).toBe("not a number");
    });
  });

  describe("object defaults — substituted, not merged with anything else", () => {
    it("only ever supplies what the literal explicitly mentions", () => {
      // `bar` isn't in the literal, and withDefault alone has no way to fill it in —
      // that's the job of the *field's own* default, applied independently once
      // normal recursion (in _validate) reaches it. See validate.test.ts for that half.
      const schema = object({ foo: string(), bar: string() }).setDefault({ foo: "x" });

      expect(withDefault(schema, undefined)).toEqual({ foo: "x" });
    });

    it("substitutes an empty object as-is, for schemas that bootstrap via .setDefault({})", () => {
      const schema = object({ foo: string() }).setDefault({});

      expect(withDefault(schema, undefined)).toEqual({});
    });
  });

  describe("recursive date repair — a composite default can carry a Date at any depth", () => {
    it("repairs a date nested inside an object default", () => {
      const schema = object({
        createdAt: date(),
        label: string(),
      }).setDefault({ createdAt: "2024-01-01T00:00:00.000Z", label: "x" } as unknown as {
        createdAt: Date;
        label: string;
      });

      const result = withDefault(schema, undefined) as { createdAt: Date; label: string };

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
      expect(result.label).toBe("x");
    });

    it("repairs a date nested inside an array default", () => {
      const schema = array(date()).setDefault(["2024-01-01T00:00:00.000Z"] as unknown as Date[]);

      const result = withDefault(schema, undefined) as Date[];

      expect(result[0]).toBeInstanceOf(Date);
      expect(result[0]?.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });

    it("repairs a date nested two levels deep (object containing an array of objects)", () => {
      const schema = object({
        events: array(object({ occursAt: date() })),
      }).setDefault({ events: [{ occursAt: "2024-01-01T00:00:00.000Z" }] } as unknown as {
        events: { occursAt: Date }[];
      });

      const result = withDefault(schema, undefined) as { events: { occursAt: Date }[] };

      expect(result.events[0]?.occursAt).toBeInstanceOf(Date);
      expect(result.events[0]?.occursAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });

    it("leaves a mismatched, non-date nested field alone — a real authoring mistake, not repaired", () => {
      const schema = object({ count: string() }).setDefault({ count: 42 } as unknown as { count: string });

      expect(withDefault(schema, undefined)).toEqual({ count: 42 });
    });
  });

  describe("discriminated union defaults — resolved via the matching member, everything else left alone", () => {
    const contactSchema = discriminatedUnion("type", [
      { type: "email", email: string() },
      { type: "phone", phone: string() },
    ]);

    it("returns the literal as-is when there's nothing to repair", () => {
      const schema = contactSchema.setDefault({ type: "email", email: "a@b.com" });

      expect(withDefault(schema, undefined)).toEqual({ type: "email", email: "a@b.com" });
    });

    it("accepts a default with just the discriminator", () => {
      const schema = contactSchema.setDefault({ type: "email" });

      expect(withDefault(schema, undefined)).toEqual({ type: "email" });
    });

    it("repairs a date nested inside the matching member's default", () => {
      const schema = discriminatedUnion("type", [
        { type: "reminder", remindAt: date() },
        { type: "note", body: string() },
      ]).setDefault({ type: "reminder", remindAt: "2024-01-01T00:00:00.000Z" } as unknown as {
        type: "reminder";
        remindAt: Date;
      });

      const result = withDefault(schema, undefined) as { type: string; remindAt: Date };

      expect(result.remindAt).toBeInstanceOf(Date);
      expect(result.remindAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });

    it("leaves the value alone when the discriminator doesn't match any member", () => {
      // Can't tell which member's fields to repair — the normal validation path is
      // what reports this as a real problem, not withDefault.
      const schema = { ...contactSchema, default: { type: "fax", number: "123" } } as unknown as Schema;

      expect(withDefault(schema, undefined)).toEqual({ type: "fax", number: "123" });
    });
  });

  describe("memoization — the recursive repair runs once per schema, not once per call", () => {
    it("returns the same object reference on repeated substitutions against the same schema", () => {
      const schema = object({ createdAt: date() }).setDefault({ createdAt: "2024-01-01T00:00:00.000Z" } as unknown as {
        createdAt: Date;
      });

      const first = withDefault(schema, undefined);
      const second = withDefault(schema, undefined);

      expect(first).toBe(second);
    });

    it("caches a discriminated union default the same way", () => {
      const schema = discriminatedUnion("type", [{ type: "reminder", remindAt: date() }]).setDefault({
        type: "reminder",
        remindAt: "2024-01-01T00:00:00.000Z",
      } as unknown as { type: "reminder"; remindAt: Date });

      expect(withDefault(schema, undefined)).toBe(withDefault(schema, undefined));
    });

    it("does not share the cache between two different schema instances with equal defaults", () => {
      const schemaA = object({ createdAt: date() }).setDefault({ createdAt: "2024-01-01T00:00:00.000Z" } as unknown as {
        createdAt: Date;
      });
      const schemaB = object({ createdAt: date() }).setDefault({ createdAt: "2024-01-01T00:00:00.000Z" } as unknown as {
        createdAt: Date;
      });

      const resultA = withDefault(schemaA, undefined);
      const resultB = withDefault(schemaB, undefined);

      expect(resultA).not.toBe(resultB);
      expect(resultA).toEqual(resultB);
    });
  });
});
