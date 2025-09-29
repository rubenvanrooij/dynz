import { describe, expect, it } from "vitest";
import { eq } from "../../conditions";
import { equals } from "../../rules";
import { SchemaType } from "../../types";
import { options } from "./builder";

describe("options builder", () => {
  it("should create options schema with provided properties", () => {
    const testOptions = ["small", "medium", "large"];
    const condition = eq("$.isRequired", true);
    const rule = equals("medium");

    const schema = options({
      options: testOptions,
      required: condition,
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.OPTIONS,
      options: testOptions,
      required: condition,
      mutable: false,
      rules: [rule],
    });
  });
});
