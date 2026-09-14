import { describe, expect, it } from "vitest";
import { object, ref, string, trim, validate } from "../../index";
import { trimFunction } from "./index";

describe("trim function", () => {
  it("should trim a static value", async () => {
    const schema = object({
      value: string().equals(trim("  admin  ")),
    });

    expect((await validate(schema, undefined, { value: "admin" })).success).toBe(true);
    expect((await validate(schema, undefined, { value: "  admin  " })).success).toBe(false);
  });

  it("should trim a referenced value", async () => {
    const schema = object({
      username: string(),
      value: string().equals(trim(ref("username"))),
    });

    expect((await validate(schema, undefined, { username: "  admin  ", value: "admin" })).success).toBe(true);
    expect((await validate(schema, undefined, { username: "  admin  ", value: "  admin  " })).success).toBe(false);
  });

  it("should return an empty string for non-string values", () => {
    expect(trimFunction(undefined)).toBe("");
    expect(trimFunction(42)).toBe("");
  });
});
