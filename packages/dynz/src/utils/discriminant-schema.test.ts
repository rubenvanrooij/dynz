import { describe, expect, it } from "vitest";
import { discriminatedUnion, string } from "../schemas";
import { SchemaType } from "../types";
import { discriminantSchema } from "./discriminant-schema";

describe("discriminantSchema", () => {
  const contact = discriminatedUnion("type", [
    { type: "email", email: string() },
    { type: "phone", phone: string() },
  ]);

  it("lists every member's discriminator value", () => {
    expect(discriminantSchema(contact)).toEqual({ type: SchemaType.OPTIONS, options: ["email", "phone"] });
  });

  it("returns the same object for the same union", () => {
    expect(discriminantSchema(contact)).toBe(discriminantSchema(contact));
  });
});
