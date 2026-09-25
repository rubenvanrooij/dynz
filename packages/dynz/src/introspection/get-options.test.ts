import { describe, expect, it } from "vitest";
import { SchemaType } from "../types";
import { getOptions } from "./get-options";

describe("getOptions", () => {
  it("should resolve a plain options field", () => {
    const schema = {
      type: SchemaType.OBJECT,
      fields: { plan: { type: SchemaType.OPTIONS, options: ["free", "pro"] } },
    };

    expect(getOptions("plan", schema, {})).toEqual([
      { value: "free", enabled: true },
      { value: "pro", enabled: true },
    ]);
  });

  describe("inside a discriminated union", () => {
    // Both members declare `plan` with different option lists, so the discriminator is
    // the only thing that says which list to render.
    const schema = {
      type: SchemaType.OBJECT,
      fields: {
        subscription: {
          type: SchemaType.DISCRIMINATED_UNION,
          key: "audience",
          schemas: [
            { audience: "personal", plan: { type: SchemaType.OPTIONS, options: ["free", "pro"] } },
            { audience: "business", plan: { type: SchemaType.OPTIONS, options: ["team", "enterprise"] } },
          ],
        },
      },
    };

    it("should follow the member the values select", () => {
      expect(getOptions("subscription.plan", schema, { subscription: { audience: "business" } })).toEqual([
        { value: "team", enabled: true },
        { value: "enterprise", enabled: true },
      ]);
    });

    it("should follow a discriminator supplied by the schema's own default", () => {
      const withDefault = {
        ...schema,
        fields: {
          subscription: { ...schema.fields.subscription, default: { audience: "business" } },
        },
      };

      expect(getOptions("subscription.plan", withDefault, {})).toEqual([
        { value: "team", enabled: true },
        { value: "enterprise", enabled: true },
      ]);
    });

    it("should follow the other member just as well", () => {
      expect(getOptions("subscription.plan", schema, { subscription: { audience: "personal" } })).toEqual([
        { value: "free", enabled: true },
        { value: "pro", enabled: true },
      ]);
    });
  });
});
