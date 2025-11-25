import { describe, expect, it } from "vitest";
import { eq } from "../../conditions";
import { minDate } from "../../rules";
import { SchemaType } from "../../types";
import { date } from "./builder";

describe("date builder", () => {
  it("should create date schema with provided properties", () => {
    const condition = eq("$.isRequired", true);
    const rule = minDate(new Date("2024-01-01"));

    const schema = date({
      required: condition,
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.DATE,
      required: condition,
      mutable: false,
      rules: [rule],
    });
  });
});
