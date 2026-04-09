import { describe, expect, it } from "vitest";
import { eq, v } from "../../functions";
import { ref } from "../../reference";
import { maxLength } from "../../rules";
import { SchemaType } from "../../types";
import { string } from "../string";
import { array } from "./builder";

describe("array builder", () => {
  it("should create array schema with provided properties", () => {
    const condition = eq(ref("$.isRequired"), v(true));
    const rule = maxLength(v(10));

    const schema = array({
      required: condition,
      schema: string(),
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.ARRAY,
      required: condition,
      schema: string(),
      mutable: false,
      rules: [rule],
    });
  });
});
