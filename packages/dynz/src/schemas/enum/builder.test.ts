import { describe, expect, it } from "vitest";
import { eq } from "../../conditions";
import { SchemaType } from "../../types";
import { enum as enumBuilder } from "./builder";

describe("enum builder", () => {
  const testEnum = {
    ADMIN: "admin",
    USER: "user",
  } as const;

  it("should create enum schema with provided properties", () => {
    const condition = eq("$.isAdmin", true);
    const rule = { type: "equals" as const, equals: "admin" };

    const schema = enumBuilder({
      enum: testEnum,
      required: condition,
      mutable: false,
      rules: [rule],
    });

    expect(schema).toEqual({
      type: SchemaType.ENUM,
      enum: testEnum,
      required: condition,
      mutable: false,
      rules: [rule],
    });
  });
});
