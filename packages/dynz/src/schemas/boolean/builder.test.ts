import { describe, expect, it } from "vitest";
import { eq } from "../../conditions";
import { equals } from "../../rules";
import { SchemaType } from "../../types";
import { boolean } from "./builder";

describe("boolean builder", () => {
  it("should create boolean schema with provided properties", () => {
    const condition = eq("$.isRequired", true);
    const rule = equals(true);

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
