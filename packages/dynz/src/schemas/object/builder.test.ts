import { describe, expect, it } from "vitest";
import { eq } from "../../conditions";
import { custom } from "../../rules";
import { SchemaType } from "../../types";
import { object } from "./builder";
import { string } from "../string";

describe("object builder", () => {
  it("should create object schema with provided properties", () => {
    const condition = eq("$.isRequired", true);
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
