import { describe, expect, it } from "vitest";
import { eq, v } from "../../functions";
import { ref } from "../../reference";
import { buildCustomRule } from "../../rules";
import { SchemaType } from "../../types";
import { dateString } from "./builder";

describe("dateString builder", () => {
  it("should create date string schema with provided properties", () => {
    const condition = eq(ref("$.isRequired"), v(true));
    const rule = buildCustomRule("testRule");

    const schema = dateString({
      format: "yyyy-MM-dd",
      required: condition,
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.DATE_STRING,
      format: "yyyy-MM-dd",
      required: condition,
      mutable: false,
      rules: [rule],
    });
  });
});
