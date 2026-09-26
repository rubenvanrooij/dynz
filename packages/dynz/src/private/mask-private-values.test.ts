import { describe, expect, it } from "vitest";
import { array, discriminatedUnion, number, object, string } from "../schemas";
import { mask } from "./builder";
import { maskPrivateValues } from "./mask-private-values";

describe("maskPrivateValues", () => {
  it("masks a private field with the default mask and leaves the rest alone", () => {
    const schema = object({ name: string(), password: string().setPrivate(true) });

    expect(maskPrivateValues(schema, { name: "Ada", password: "secret" })).toEqual({
      name: "Ada",
      password: { state: "masked", value: "***" },
    });
  });

  it("uses a named masker", () => {
    const schema = object({ iban: string().setPrivate({ mask: "last4" }) });

    const result = maskPrivateValues(
      schema,
      { iban: "NL91ABNA0417164300" },
      { maskers: { last4: (value) => `****${String(value).slice(-4)}` } }
    );

    expect(result).toEqual({ iban: { state: "masked", value: "****4300" } });
  });

  it("throws when a named masker is missing", () => {
    const schema = object({ iban: string().setPrivate({ mask: "last4" }) });

    expect(() => maskPrivateValues(schema, { iban: "x" })).toThrow(
      'No masker named "last4" was supplied for private field $.iban'
    );
  });

  it("leaves an empty private field empty, without adding keys", () => {
    const schema = object({ pin: number().setPrivate(true).optional() });

    expect(maskPrivateValues(schema, {})).toEqual({});
  });

  it("masks a private root leaf", () => {
    expect(maskPrivateValues(string().setPrivate(true), "secret")).toEqual(mask());
  });

  it("masks private items in an array", () => {
    const schema = object({ keys: array(string().setPrivate(true)) });

    expect(maskPrivateValues(schema, { keys: ["a", "b"] })).toEqual({ keys: [mask(), mask()] });
  });

  it("masks private fields of the matching discriminated union member only", () => {
    const schema = object({
      payout: discriminatedUnion("type", [
        { type: "iban", iban: string().setPrivate(true) },
        { type: "paypal", email: string() },
      ]),
    });

    expect(maskPrivateValues(schema, { payout: { type: "iban", iban: "NL00" } })).toEqual({
      payout: { type: "iban", iban: mask() },
    });
    expect(maskPrivateValues(schema, { payout: { type: "paypal", email: "a@b.c" } })).toEqual({
      payout: { type: "paypal", email: "a@b.c" },
    });
  });
});

describe("mask", () => {
  it("passes falsy values to the mask function", () => {
    expect(mask(0, (value) => `v=${value}`)).toEqual({ state: "masked", value: "v=0" });
    expect(mask("", (value) => `v=${value}`)).toEqual({ state: "masked", value: "v=" });
  });
});
