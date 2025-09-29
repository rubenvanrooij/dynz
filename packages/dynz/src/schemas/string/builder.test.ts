import { describe, expect, it } from "vitest";
import { eq } from "../../conditions";
import { minLength } from "../../rules";
import { SchemaType } from "../../types";
import { string } from "./builder";

describe("string builder", () => {
  it("should create string schema with provided properties", () => {
    const condition = eq("$.isRequired", true);
    const rule = minLength(5);

    const schema = string({
      required: condition,
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.STRING,
      required: condition,
      mutable: false,
      rules: [rule],
    });
  });
});
