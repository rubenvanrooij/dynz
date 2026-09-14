import { describe, expect, it } from "vitest";
import { object, ref, replace, string, validate } from "../../index";
import { replaceFunction } from "./index";

describe("replace function", () => {
  it("should replace matches in a static value", async () => {
    const schema = object({
      value: string().equals(replace("hello   world", "\\s+", " ", "g")),
    });

    expect((await validate(schema, undefined, { value: "hello world" })).success).toBe(true);
    expect((await validate(schema, undefined, { value: "hello   world" })).success).toBe(false);
  });

  it("should replace matches in a referenced value", async () => {
    const schema = object({
      note: string(),
      value: string().equals(replace(ref("note"), "\\s+", " ", "g")),
    });

    expect((await validate(schema, undefined, { note: "hello   world", value: "hello world" })).success).toBe(true);
    expect((await validate(schema, undefined, { note: "hello   world", value: "hello   world" })).success).toBe(false);
  });

  it("should support capture group references in the replacement", async () => {
    const schema = object({
      value: string().equals(replace("2026-09-14", "(\\d{4})-(\\d{2})-(\\d{2})", "$3/$2/$1")),
    });

    expect((await validate(schema, undefined, { value: "14/09/2026" })).success).toBe(true);
  });

  it("should return an empty string for non-string input values", () => {
    expect(replaceFunction(undefined, "a", "b")).toBe("");
    expect(replaceFunction(42, "a", "b")).toBe("");
  });

  it("should return the original string when the pattern or replacement isn't a string", () => {
    expect(replaceFunction("hello", undefined, "b")).toBe("hello");
    expect(replaceFunction("hello", "a", undefined)).toBe("hello");
  });
});
