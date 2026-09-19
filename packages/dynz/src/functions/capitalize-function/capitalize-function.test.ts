import { describe, expect, it } from "vitest";
import { capitalize, object, ref, string, validate } from "../../index";
import { capitalizeFunction } from "./index";

describe("capitalize function", () => {
  it("should capitalize a static value", async () => {
    const schema = object({
      value: string().equals(capitalize("jOHN")),
    });

    expect((await validate(schema, undefined, { value: "John" })).success).toBe(true);
    expect((await validate(schema, undefined, { value: "jOHN" })).success).toBe(false);
  });

  it("should capitalize a referenced value", async () => {
    const schema = object({
      firstName: string(),
      value: string().equals(capitalize(ref("firstName"))),
    });

    expect((await validate(schema, undefined, { firstName: "jOHN", value: "John" })).success).toBe(true);
    expect((await validate(schema, undefined, { firstName: "jOHN", value: "jOHN" })).success).toBe(false);
  });

  it("should handle empty strings and non-string values", () => {
    expect(capitalizeFunction("")).toBe("");
    expect(capitalizeFunction(undefined)).toBe("");
    expect(capitalizeFunction(42)).toBe("");
  });
});
