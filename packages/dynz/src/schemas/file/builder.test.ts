import { describe, expect, it } from "vitest";
import { eq } from "../../conditions";
import { maxSize } from "../../rules";
import { SchemaType } from "../../types";
import { file } from "./builder";

describe("file builder", () => {
  it("should create file schema with provided properties", () => {
    const condition = eq("$.isRequired", true);
    const rule = maxSize(1024);

    const schema = file({
      required: condition,
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.FILE,
      required: condition,
      mutable: false,
      rules: [rule],
    });
  });
});
