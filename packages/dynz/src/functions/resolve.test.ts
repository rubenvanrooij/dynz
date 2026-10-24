import { describe, expect, it } from "vitest";
import { ref } from "../reference";
import { array, discriminatedUnion, object, string } from "../schemas";
import { SchemaType } from "../types";
import { getNested } from "../utils";
import { eq } from "./equals-function";
import { resolve, resolvePredicate } from "./resolve";

describe("resolve", () => {
  describe("reference to a discriminated union's discriminator", () => {
    const schema = object({
      options: array(
        discriminatedUnion("type", [
          { type: "always", value: string() },
          { type: "disabled", value: string() },
          { type: "conditionally", condition: string(), value: string() },
        ])
      ),
    });
    const values = { options: [{ type: "always", value: "a" }] };
    const context = { schema, values };

    it("getNested pairs the discriminator value with an options schema", () => {
      expect(getNested("$.options.0.type", schema, values)).toEqual({
        value: "always",
        schema: { type: SchemaType.OPTIONS, options: ["always", "disabled", "conditionally"] },
      });
    });

    it("resolves the discriminator value", () => {
      expect(resolve(ref("$.options.0.type"), "$", context)).toBe("always");
    });

    it("resolves a predicate on the discriminator", () => {
      expect(resolvePredicate(eq(ref("$.options.0.type"), "always"), "$", context)).toBe(true);
      expect(resolvePredicate(eq(ref("$.options.0.type"), "disabled"), "$", context)).toBe(false);
    });

    it("still resolves a member field", () => {
      expect(resolve(ref("$.options.0.value"), "$", context)).toBe("a");
    });
  });

  describe("reference into a path another union member declares", () => {
    const schema = object({
      payment: discriminatedUnion("method", [
        { method: "card", holder: string() },
        { method: "iban", holder: object({ name: string() }) },
      ]),
    });

    it("resolves to undefined while a member declaring a leaf there is active", () => {
      expect(resolve(ref("$.payment.holder.name"), "$", { schema, values: { payment: { method: "card" } } })).toBe(
        undefined
      );
    });

    it("resolves the value while its own member is active", () => {
      expect(
        resolve(ref("$.payment.holder.name"), "$", {
          schema,
          values: { payment: { method: "iban", holder: { name: "Jan" } } },
        })
      ).toBe("Jan");
    });
  });
});
