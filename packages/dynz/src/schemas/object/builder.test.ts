import { describe, expect, it } from "vitest";
import { eq, v } from "../../functions";
import { ref } from "../../reference";
import { custom } from "../../rules";
import { SchemaType } from "../../types";
import { string } from "../string";
import { object } from "./builder";

describe("object builder", () => {
  it("should create object schema with provided properties", () => {
    const condition = eq(ref("$.isRequired"), v(true));
    const rule = custom("testRule");

    const schema = object({
      fields: {
        name: string(),
      },
      required: condition,
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.OBJECT,
      fields: {
        name: string(),
      },
      required: condition,
      mutable: false,
      rules: [rule],
    });
  });
});
