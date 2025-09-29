import { describe, expect, it } from "vitest";
import { eq } from "../../conditions";
import { maxLength } from "../../rules";
import { SchemaType } from "../../types";
import { string } from "../string";
import { array } from "./builder";

describe("array builder", () => {
  it("should create array schema with provided properties", () => {
    const condition = eq("$.isRequired", true);
    const rule = maxLength(10);

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
