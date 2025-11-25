import { describe, expect, it } from "vitest";
import { eq } from "../../conditions";
import { equals } from "../../rules";
import { SchemaType } from "../../types";
import { enum as enumBuilder } from "./builder";

describe("enum builder", () => {
  const testEnum = {
    ADMIN: "admin",
    USER: "user",
  } as const;

  it("should create enum schema with provided properties", () => {
    const condition = eq("$.isAdmin", true);
    const rule = equals("admin");

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
