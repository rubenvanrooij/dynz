import { describe, expect, it } from "vitest";
import { object, ref, string, uppercase, validate } from "../../index";
import { uppercaseFunction } from "./index";

describe("uppercase function", () => {
  it("should uppercase a static value", async () => {
    const schema = object({
      value: string().equals(uppercase("nl")),
    });

    expect((await validate(schema, undefined, { value: "NL" })).success).toBe(true);
    expect((await validate(schema, undefined, { value: "nl" })).success).toBe(false);
  });

  it("should uppercase a referenced value", async () => {
    const schema = object({
      countryCode: string(),
      value: string().equals(uppercase(ref("countryCode"))),
    });

    expect((await validate(schema, undefined, { countryCode: "nl", value: "NL" })).success).toBe(true);
    expect((await validate(schema, undefined, { countryCode: "nl", value: "nl" })).success).toBe(false);
  });

  it("should return an empty string for non-string values", () => {
    expect(uppercaseFunction(undefined)).toBe("");
    expect(uppercaseFunction(42)).toBe("");
  });
});
