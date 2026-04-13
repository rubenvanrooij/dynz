import { describe, expect, it } from "vitest";
import { eq, v } from "../../functions";
import { ref } from "../../reference";
import { minLength } from "../../rules";
import { SchemaType } from "../../types";
import { string } from "./builder";

describe("string builder", () => {
  it("should create string schema with provided properties", () => {
    const condition = eq(ref("$.isRequired"), v(true));
    const rule = minLength(v(5));

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
