import { describe, expect, it } from "vitest";
import { lowercase, object, ref, string, validate } from "../../index";
import { lowercaseFunction } from "./index";

describe("lowercase function", () => {
  it("should lowercase a static value", async () => {
    const schema = object({
      value: string().equals(lowercase("USER@EXAMPLE.COM")),
    });

    expect((await validate(schema, undefined, { value: "user@example.com" })).success).toBe(true);
    expect((await validate(schema, undefined, { value: "USER@EXAMPLE.COM" })).success).toBe(false);
  });

  it("should lowercase a referenced value", async () => {
    const schema = object({
      email: string(),
      value: string().equals(lowercase(ref("email"))),
    });

    expect((await validate(schema, undefined, { email: "USER@EXAMPLE.COM", value: "user@example.com" })).success).toBe(
      true
    );
    expect((await validate(schema, undefined, { email: "USER@EXAMPLE.COM", value: "USER@EXAMPLE.COM" })).success).toBe(
      false
    );
  });

  it("should return an empty string for non-string values", () => {
    expect(lowercaseFunction(undefined)).toBe("");
    expect(lowercaseFunction(42)).toBe("");
  });
});
