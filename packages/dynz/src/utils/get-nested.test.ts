import { describe, expect, it } from "vitest";
import { SchemaType } from "../types";
import { getNested } from "./get-nested";

describe("getNested", () => {
  describe("object traversal", () => {
    it("should get nested value from object", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          user: {
            type: SchemaType.OBJECT,
            fields: {
              name: {
                type: SchemaType.STRING,
              },
            },
          },
        },
      };
      const value = { user: { name: "John" } };

      const result = getNested("$.user.name", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.STRING },
        value: "John",
      });
    });

    it("should return default value when field is undefined", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          user: {
            type: SchemaType.OBJECT,
            fields: {
              age: {
                type: SchemaType.NUMBER,
                default: 0,
              },
            },
            default: { age: 0 },
          },
        },
      };
      const value = { user: {} };

      const result = getNested("$.user.age", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.NUMBER, default: 0 },
        value: 0,
      });
    });

    it("resolves a field's value from the *parent* object's own default, not the field's own default", () => {
      // Regression test: the parent object's own default used to be ignored entirely
      // here — the field's own default ("jan") was returned instead of the value the
      // parent's default actually supplies for that field ("kees").
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          name: { type: SchemaType.STRING, default: "jan" },
          surname: { type: SchemaType.STRING },
        },
        default: { name: "kees", surname: "van Rooij" },
      };

      const result = getNested("$.name", schema, undefined);

      expect(result).toEqual({
        schema: { type: SchemaType.STRING, default: "jan" },
        value: "kees",
      });
    });

    it("prefers the parent object's default over the field's own default when both supply a value", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          name: { type: SchemaType.STRING, default: "jan" },
        },
        default: { name: "kees" },
      };

      const result = getNested("$.name", schema, undefined);

      expect(result).toEqual({ schema: { type: SchemaType.STRING, default: "jan" }, value: "kees" });
    });

    it("should handle undefined nested object", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          user: {
            type: SchemaType.OBJECT,
            fields: {
              name: {
                type: SchemaType.STRING,
              },
            },
          },
        },
      };
      const value = {};

      const result = getNested("$.user.name", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.STRING },
        value: undefined,
      });
    });

    it("should throw error when expected object but got different type", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          user: {
            type: SchemaType.OBJECT,
            fields: {
              name: {
                type: SchemaType.STRING,
              },
            },
          },
        },
      };
      const value = { user: "not an object" };

      expect(() => getNested("$.user.name", schema, value)).toThrow(
        "Expected an object at path $.user.name, but got string"
      );
    });

    it("returns null when the field does not exist in the schema", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          existing: {
            type: SchemaType.STRING,
          },
        },
      };
      const value = { existing: "value" };

      expect(getNested("$.nonexistent", schema, value)).toBeNull();
    });
  });

  describe("array traversal", () => {
    it("should get value from array element", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          items: {
            type: SchemaType.ARRAY,
            schema: {
              type: SchemaType.STRING,
            },
          },
        },
      };
      const value = { items: ["first", "second", "third"] };

      const result = getNested("$.items[1]", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.STRING },
        value: "second",
      });
    });

    it("should return the item schema's default value when an array element is undefined", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          items: {
            type: SchemaType.ARRAY,
            schema: {
              type: SchemaType.STRING,
              default: "default",
            },
            // The array's own default (a whole-array substitute, applied when the array
            // itself is missing) must not be confused with a missing element falling
            // back to the *item* schema's default — two different things.
            default: ["should not be used"],
          },
        },
      };
      const value = { items: [undefined] };

      const result = getNested("$.items[0]", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.STRING, default: "default" },
        value: "default",
      });
    });

    it("should throw error when expected array but got different type", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          items: {
            type: SchemaType.ARRAY,
            schema: {
              type: SchemaType.STRING,
            },
          },
        },
      };
      const value = { items: "not an array" };

      expect(() => getNested("$.items[0]", schema, value)).toThrow(
        "Expected an array at path $.items[0], but got string"
      );
    });

    it("should handle nested objects in array", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          users: {
            type: SchemaType.ARRAY,
            schema: {
              type: SchemaType.OBJECT,
              fields: {
                name: {
                  type: SchemaType.STRING,
                },
              },
            },
          },
        },
      };
      const value = { users: [{ name: "Alice" }, { name: "Bob" }] };

      const result = getNested("$.users[1].name", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.STRING },
        value: "Bob",
      });
    });

    it("resolves an array's own default when it's the root schema, instead of throwing", () => {
      // Regression test: root-level arrays aren't shielded by a parent OBJECT field
      // lookup (which is what applies an array's own default in the common nested
      // case), so the ARRAY branch has to resolve its own default itself.
      const schema = {
        type: SchemaType.ARRAY,
        schema: { type: SchemaType.STRING },
        default: ["a", "b"],
      };

      const result = getNested("$[0]", schema, undefined);

      expect(result).toEqual({ schema: { type: SchemaType.STRING }, value: "a" });
    });
  });

  describe("discriminated union traversal", () => {
    const contactSchema = {
      type: SchemaType.DISCRIMINATED_UNION,
      key: "type",
      schemas: [
        { type: "email", email: { type: SchemaType.STRING } },
        { type: "phone", phone: { type: SchemaType.STRING } },
      ],
    };

    it("resolves the discriminator key", () => {
      const schema = { type: SchemaType.OBJECT, fields: { contact: contactSchema } };
      const value = { contact: { type: "email", email: "a@b.com" } };

      const result = getNested("$.contact.type", schema, value);

      expect(result).toEqual({ schema: { type: SchemaType.OPTIONS, options: ["email", "phone"] }, value: "email" });
    });

    it("resolves a real member field's own value, not the whole union object", () => {
      // Regression test: this used to return the entire { type, email } object instead
      // of just the email field's value.
      const schema = { type: SchemaType.OBJECT, fields: { contact: contactSchema } };
      const value = { contact: { type: "email", email: "a@b.com" } };

      const result = getNested("$.contact.email", schema, value);

      expect(result).toEqual({ schema: { type: SchemaType.STRING }, value: "a@b.com" });
    });

    it("falls back to the union's own default when the union itself is absent", () => {
      const defaultedContact = { ...contactSchema, default: { type: "email", email: "default@b.com" } };
      const schema = { type: SchemaType.OBJECT, fields: { contact: defaultedContact } };

      const result = getNested("$.contact.email", schema, {});

      expect(result).toEqual({ schema: { type: SchemaType.STRING }, value: "default@b.com" });
    });

    it("resolves the discriminator key from the union's own default too", () => {
      const defaultedContact = { ...contactSchema, default: { type: "email", email: "default@b.com" } };
      const schema = { type: SchemaType.OBJECT, fields: { contact: defaultedContact } };

      const result = getNested("$.contact.type", schema, {});

      expect(result).toEqual({ schema: { type: SchemaType.OPTIONS, options: ["email", "phone"] }, value: "email" });
    });

    it("falls back to a member field's own default when the union is present but that field is absent", () => {
      // Regression test: this used to return `undefined` for the missing field instead
      // of consulting its own default — inconsistent with the OBJECT branch's per-field
      // fallback.
      const withFieldDefault = {
        type: SchemaType.DISCRIMINATED_UNION,
        key: "type",
        schemas: [
          { type: "email", email: { type: SchemaType.STRING, default: "fallback@b.com" } },
          { type: "phone", phone: { type: SchemaType.STRING } },
        ],
      };
      const schema = { type: SchemaType.OBJECT, fields: { contact: withFieldDefault } };
      const value = { contact: { type: "email" } };

      const result = getNested("$.contact.email", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.STRING, default: "fallback@b.com" },
        value: "fallback@b.com",
      });
    });

    it("returns null when the union is absent and has no default", () => {
      const schema = { type: SchemaType.OBJECT, fields: { contact: contactSchema } };

      expect(getNested("$.contact.email", schema, {})).toBeNull();
    });

    it("returns null when the discriminator value doesn't match any member", () => {
      const schema = { type: SchemaType.OBJECT, fields: { contact: contactSchema } };
      const value = { contact: { type: "fax", number: "123" } };

      expect(getNested("$.contact.email", schema, value)).toBeNull();
    });

    describe("a path declared by another member", () => {
      // `holder` is a leaf in the card member and an object in the iban member
      const paymentSchema = {
        type: SchemaType.OBJECT,
        fields: {
          payment: {
            type: SchemaType.DISCRIMINATED_UNION,
            key: "method",
            schemas: [
              { method: "card", card: { type: SchemaType.STRING }, holder: { type: SchemaType.STRING } },
              {
                method: "iban",
                iban: { type: SchemaType.STRING },
                holder: { type: SchemaType.OBJECT, fields: { name: { type: SchemaType.STRING } } },
              },
            ],
          },
        },
      };

      it("returns null when the active member declares it as a leaf", () => {
        expect(
          getNested("$.payment.holder.name", paymentSchema, { payment: { method: "card", holder: "Jan" } })
        ).toBeNull();
      });

      it("returns null when the active member declares it as a leaf without a value", () => {
        expect(getNested("$.payment.holder.name", paymentSchema, { payment: { method: "card" } })).toBeNull();
      });

      it("returns null when the active member doesn't declare it", () => {
        expect(getNested("$.payment.iban", paymentSchema, { payment: { method: "card" } })).toBeNull();
      });

      it("resolves it when its own member is active", () => {
        expect(
          getNested("$.payment.holder.name", paymentSchema, { payment: { method: "iban", holder: { name: "Jan" } } })
        ).toEqual({ schema: { type: SchemaType.STRING }, value: "Jan" });
      });

      it("returns null when no member declares it", () => {
        expect(getNested("$.payment.doesNotExist", paymentSchema, { payment: { method: "card" } })).toBeNull();
        expect(getNested("$.payment.card.number", paymentSchema, { payment: { method: "card" } })).toBeNull();
      });
    });
  });

  describe("coercion integration", () => {
    it("should apply coercion to final value", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          count: {
            type: SchemaType.NUMBER,
            coerce: true,
          },
        },
      };
      const value = { count: "123" };

      const result = getNested("$.count", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.NUMBER, coerce: true },
        value: 123,
      });
    });
  });

  describe("leaf traversal", () => {
    it("returns null when trying to traverse a non-object, non-array", () => {
      const schema = {
        type: SchemaType.STRING,
      };
      const value = "string value";

      expect(getNested("$.field", schema, value)).toBeNull();
    });
  });

  describe("root access", () => {
    it("should return root value and schema when path is just root", () => {
      const schema = {
        type: SchemaType.STRING,
        coerce: true,
      };
      const value = 123;

      const result = getNested("$", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.STRING, coerce: true },
        value: "123", // coerced
      });
    });
  });

  describe("complex nested scenarios", () => {
    it("should handle deeply nested mixed structures", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          data: {
            type: SchemaType.OBJECT,
            fields: {
              users: {
                type: SchemaType.ARRAY,
                schema: {
                  type: SchemaType.OBJECT,
                  fields: {
                    profile: {
                      type: SchemaType.OBJECT,
                      fields: {
                        preferences: {
                          type: SchemaType.ARRAY,
                          schema: {
                            type: SchemaType.BOOLEAN,
                            coerce: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const value = {
        data: {
          users: [
            {
              profile: {
                preferences: ["true", "false"],
              },
            },
          ],
        },
      };

      const result = getNested("$.data.users[0].profile.preferences[0]", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.BOOLEAN, coerce: true },
        value: true, // coerced from "true" to true
      });
    });
  });
});
