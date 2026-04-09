import { describe, expect, it } from "vitest";
import { eq, v } from "../../functions";
import { ref } from "../../reference";
import { min } from "../../rules";
import { SchemaType } from "../../types";
import { number } from "./builder";

describe("number builder", () => {
  it("should create number schema with provided properties", () => {
    const condition = eq(ref("$.isRequired"), v(true));
    const rule = min(v(0));

    const schema = number({
      required: condition,
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.NUMBER,
      required: condition,
      mutable: false,
      rules: [rule],
    });
  });
});
