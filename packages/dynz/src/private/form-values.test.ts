import { describe, expect, it } from "vitest";
import { number, object, string } from "../schemas";
import { validate } from "../validate";
import { mask, plain } from "./builder";
import { toFormValues, toSubmitValues } from "./form-values";
import { maskPrivateValues } from "./mask-private-values";

const schema = object({
  name: string(),
  iban: string().setPrivate({ mask: "last4" }),
  pin: number().setPrivate(true).min(1000),
});

const maskers = { last4: (value: unknown) => `****${String(value).slice(-4)}` };

describe("toFormValues", () => {
  it("replaces masked values with their display string", () => {
    expect(toFormValues(schema, { name: "Ada", iban: mask("x", () => "****4300"), pin: mask() })).toEqual({
      name: "Ada",
      iban: "****4300",
      pin: "***",
    });
  });
});

describe("toSubmitValues", () => {
  const server = { name: "Ada", iban: mask("x", () => "****4300"), pin: mask() };

  it("sends an untouched field back as its mask marker", () => {
    expect(toSubmitValues(schema, { name: "Ada", iban: "****4300", pin: "***" }, server)).toEqual({
      name: "Ada",
      iban: server.iban,
      pin: server.pin,
    });
  });

  it("wraps an edited field as plain()", () => {
    expect(toSubmitValues(schema, { name: "Ada", iban: "NL02ABNA0123456789", pin: 4321 }, server)).toEqual({
      name: "Ada",
      iban: plain("NL02ABNA0123456789"),
      pin: plain(4321),
    });
  });

  it("wraps every private field as plain() when there is no server payload", () => {
    expect(toSubmitValues(schema, { name: "Ada", iban: "NL02", pin: 4321 }, undefined)).toEqual({
      name: "Ada",
      iban: plain("NL02"),
      pin: plain(4321),
    });
  });
});

describe("round trip", () => {
  it("masks, edits one field, and persists the stored value for the untouched one", async () => {
    const stored = { name: "Ada", iban: "NL91ABNA0417164300", pin: 1234 };

    // server → client
    const payload = maskPrivateValues(schema, stored, { maskers });
    const form = toFormValues(schema, payload) as Record<string, unknown>;

    // the user changes the pin, leaves the IBAN alone
    const submitted = toSubmitValues(schema, { ...form, pin: 5678 }, payload);

    // client-side validation skips the untouched masked field
    expect(await validate(schema, undefined, submitted)).toMatchObject({ success: true });

    // server-side validation substitutes the stored value
    expect(await validate(schema, stored, submitted)).toEqual({
      success: true,
      values: { name: "Ada", iban: "NL91ABNA0417164300", pin: 5678 },
    });
  });

  it("reports an invalid edit without leaking the stored secret", async () => {
    const stored = { name: "Ada", iban: "NL91ABNA0417164300", pin: 1234 };
    const payload = maskPrivateValues(schema, stored, { maskers });
    const submitted = toSubmitValues(schema, { ...(toFormValues(schema, payload) as object), pin: 12 }, payload);

    const result = await validate(schema, stored, submitted);

    expect(result).toMatchObject({ success: false, errors: [{ path: "$.pin", code: "min" }] });
    expect(JSON.stringify(result)).not.toContain("1234");
  });
});
