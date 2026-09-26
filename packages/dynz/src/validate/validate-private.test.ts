import { describe, expect, expectTypeOf, it } from "vitest";
import { eq } from "../functions";
import { mask, plain } from "../private";
import { ref } from "../reference";
import { array, discriminatedUnion, number, object, string } from "../schemas";
import { ErrorCode, type SchemaInput, type SchemaValues } from "../types";
import { validate } from "./validate";

describe("validate — private fields", () => {
  const account = object({
    name: string(),
    password: string().setPrivate(true).min(8),
    pin: number().setPrivate(true).optional(),
  });

  describe("input shapes", () => {
    it("accepts a raw value as plain and returns it unwrapped", async () => {
      expect(await validate(account, undefined, { name: "a", password: "secret123" })).toEqual({
        success: true,
        values: { name: "a", password: "secret123" },
      });
    });

    it("unwraps plain() values in the output", async () => {
      expect(await validate(account, undefined, { name: "a", password: plain("secret123"), pin: plain(1234) })).toEqual(
        {
          success: true,
          values: { name: "a", password: "secret123", pin: 1234 },
        }
      );
    });

    it("lets an optional private field be omitted", async () => {
      expect(await validate(account, undefined, { name: "a", password: "secret123" })).toMatchObject({ success: true });
    });

    it("applies a private field's default when it is omitted", async () => {
      const schema = object({ token: string().setPrivate(true).setDefault("fallback") });

      expect(await validate(schema, undefined, {})).toEqual({ success: true, values: { token: "fallback" } });
    });

    it("still enforces rules on plain values", async () => {
      const result = await validate(account, undefined, { name: "a", password: plain("short") });

      expect(result).toMatchObject({ success: false, errors: [{ path: "$.password", code: "min_length" }] });
    });
  });

  describe("server mode (current values supplied)", () => {
    const stored = { name: "a", password: "storedSecret1", pin: 1234 };

    it("resolves a masked value to the stored value, so the output is ready to persist", async () => {
      expect(await validate(account, stored, { name: "b", password: mask(), pin: mask() })).toEqual({
        success: true,
        values: { name: "b", password: "storedSecret1", pin: 1234 },
      });
    });

    it("rejects a masked value when nothing is stored", async () => {
      const result = await validate(
        account,
        { name: "a", password: "storedSecret1" },
        { name: "a", password: mask(), pin: mask() }
      );

      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({ path: "$.pin", code: ErrorCode.MASKED })],
      });
    });

    it("treats a masked value on an immutable field as unchanged", async () => {
      const schema = object({ key: string().setPrivate(true).setMutable(false) });

      expect(await validate(schema, { key: "k1" }, { key: mask() })).toEqual({ success: true, values: { key: "k1" } });
    });

    it("flags a changed plain value on an immutable field", async () => {
      const schema = object({ key: string().setPrivate(true).setMutable(false) });

      const result = await validate(schema, { key: "k1" }, { key: plain("k2") });

      expect(result).toMatchObject({ success: false, errors: [{ code: ErrorCode.IMMUTABLE }] });
    });

    it("does not throw when an immutable private field has no stored value", async () => {
      const schema = object({ key: string().setPrivate(true).setMutable(false).optional() });

      expect(await validate(schema, {}, {})).toEqual({ success: true, values: {} });
    });

    it("resolves masked items in an array by index", async () => {
      const schema = object({ keys: array(string().setPrivate(true)) });

      expect(await validate(schema, { keys: ["a", "b"] }, { keys: [mask(), plain("c")] })).toEqual({
        success: true,
        values: { keys: ["a", "c"] },
      });
    });

    it("resolves masked values inside the matching discriminated union member", async () => {
      const schema = object({
        payout: discriminatedUnion("type", [
          { type: "iban", iban: string().setPrivate(true) },
          { type: "paypal", email: string() },
        ]),
      });

      const current = { payout: { type: "iban" as const, iban: "NL00BANK0123456789" } };

      expect(await validate(schema, current, { payout: { type: "iban", iban: mask() } })).toEqual({
        success: true,
        values: current,
      });
    });

    it("accepts legacy wrapped current values", async () => {
      const result = await validate(account, { name: "a", password: plain("storedSecret1") } as never, {
        name: "a",
        password: mask(),
      });

      expect(result).toEqual({ success: true, values: { name: "a", password: "storedSecret1" } });
    });
  });

  describe("client mode (no current values)", () => {
    it("passes an untouched masked value through unvalidated", async () => {
      expect(await validate(account, undefined, { name: "a", password: mask("x", () => "****") })).toEqual({
        success: true,
        values: { name: "a", password: { state: "masked", value: "****" } },
      });
    });

    it("skips a masked field even when current values are masked too", async () => {
      const current = { name: "a", password: mask() } as never;

      expect(await validate(account, current, { name: "a", password: mask() })).toMatchObject({ success: true });
    });
  });

  describe("references and conditions", () => {
    it("resolves ref() to a private field's plain value", async () => {
      const schema = object({ password: string().setPrivate(true), confirm: string().equals(ref("password")) });

      expect(await validate(schema, undefined, { password: plain("x"), confirm: "x" })).toMatchObject({
        success: true,
      });
    });

    it("evaluates conditions against a private field's plain value", async () => {
      const schema = object({
        password: string().setPrivate(true),
        hint: string()
          .setIncluded(eq(ref("password"), "x"))
          .optional(),
      });

      expect(await validate(schema, undefined, { password: plain("x"), hint: "h" })).toMatchObject({ success: true });
    });

    it("resolves ref() to the stored value behind a masked field", async () => {
      const schema = object({ password: string().setPrivate(true), confirm: string().equals(ref("password")) });

      expect(
        await validate(schema, { password: "stored", confirm: "stored" }, { password: mask(), confirm: "stored" })
      ).toMatchObject({
        success: true,
      });
    });
  });

  describe("error redaction", () => {
    it("never returns a private field's submitted or stored value in an error", async () => {
      const result = await validate(
        account,
        { name: "a", password: "storedSecret1" },
        { name: "a", password: plain("short") }
      );

      expect(result.success).toBe(false);
      expect(JSON.stringify(result)).not.toContain("storedSecret1");
      expect(JSON.stringify(result)).not.toContain('"short"');
    });

    it("scrubs a private value out of a rule's message", async () => {
      const schema = object({ iban: string().setPrivate(true).regex("^[A-Z]{2}") });

      const result = await validate(schema, undefined, { iban: plain("bad-iban") });

      expect(result).toMatchObject({ success: false, errors: [{ code: "regex" }] });
      expect(JSON.stringify(result)).not.toContain("bad-iban");
    });

    it("keeps values on errors for non-private fields", async () => {
      const result = await validate(object({ name: string().min(3) }), undefined, { name: "ab" });

      expect(result).toMatchObject({ success: false, errors: [{ value: "ab" }] });
    });
  });

  describe("leaf-only", () => {
    it("throws for a private container in a plain-object schema", async () => {
      const schema = { type: "object", private: true, fields: { a: { type: "string" } } } as never;

      await expect(validate(schema, undefined, { a: "x" })).rejects.toThrow(
        "private is only supported on leaf schemas: $"
      );
    });
  });

  describe("types", () => {
    it("types the output as plain values and the input as wrapper-or-raw", () => {
      type Output = SchemaValues<typeof account>;
      type Input = SchemaInput<typeof account>;

      expectTypeOf<Output["password"]>().toEqualTypeOf<string>();
      expectTypeOf<{ state: "masked"; value: string }>().toExtend<Input["password"]>();
      expectTypeOf<string>().toExtend<Input["password"]>();
    });

    it("does not offer setPrivate on containers", () => {
      const setOnContainers = () => {
        // @ts-expect-error -- private is only supported on leaf schemas
        object({ a: string() }).setPrivate(true);
        // @ts-expect-error -- private is only supported on leaf schemas
        array(string()).setPrivate(true);
      };

      expect(setOnContainers).toThrow();
    });
  });
});
