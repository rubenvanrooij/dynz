import { describe, expect, it } from "vitest";
import { eq, v } from "../../functions";
import { ref } from "../../reference";
import { equals } from "../../rules";
import { SchemaType } from "../../types";
import { boolean } from "./builder";

describe("boolean builder", () => {
  it("should create boolean schema with provided properties", () => {
    const condition = eq(ref("$.isRequired"), v(true));
    const rule = equals(v(true));

    const schema = boolean({
      required: condition,
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.BOOLEAN,
      required: condition,
      mutable: false,
      rules: [rule],
    });
  });
});
