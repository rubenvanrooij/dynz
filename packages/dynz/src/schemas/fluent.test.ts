import { describe, expect, it } from "vitest";
import { eq, sum, v } from "../functions";
import { ref } from "../reference";
import { email, maxLength, minLength } from "../rules";
import { object } from "./object/builder";
import { obj } from "./object/fluent";
import { string } from "./string/builder";
import { str } from "./string/fluent";

describe("Fluent API", () => {
  describe("StringSchemaFluent", () => {
    it("creates a basic string schema", () => {
      const schema = str();

      expect(schema.type).toBe("string");
      expect(schema.rules).toBeUndefined();
    });

    it("adds minLength rule via fluent method", () => {
      const schema = str().minLength(v(3));

      expect(schema.type).toBe("string");
      expect(schema.rules).toHaveLength(1);
      expect(schema.rules![0]).toEqual({
        type: "min_length",
        min: { type: "st", value: 3 },
        code: undefined,
      });
    });

    it("chains multiple rules", () => {
      const schema = str().minLength(v(3)).maxLength(v(100)).email();

      expect(schema.rules).toHaveLength(3);
      expect(schema.rules![0].type).toBe("min_length");
      expect(schema.rules![1].type).toBe("max_length");
      expect(schema.rules![2].type).toBe("email");
    });

    it("supports references in rules", () => {
      const schema = str().minLength(ref("config.minLen"));

      expect(schema.rules![0]).toEqual({
        type: "min_length",
        min: { type: "_dref", path: "config.minLen" },
        code: undefined,
      });
    });

    it("supports transformers in rules (the key benefit!)", () => {
      // This is the main benefit: sum() is the TRANSFORMER, .minLength is the RULE
      // Clear separation: methods are rules, imports are functions
      const schema = str().minLength(sum(ref("a"), ref("b")));

      expect(schema.rules![0]).toEqual({
        type: "min_length",
        min: {
          type: "sum",
          value: [
            { type: "_dref", path: "a" },
            { type: "_dref", path: "b" },
          ],
        },
        code: undefined,
      });
    });

    it("sets required property", () => {
      const schema = str().setRequired();
      expect(schema.required).toBe(true);

      const schema2 = str().setRequired(false);
      expect(schema2.required).toBe(false);
    });

    it("sets optional (required: false)", () => {
      const schema = str().optional();
      expect(schema.required).toBe(false);
    });

    it("supports predicate for required", () => {
      const schema = str().setRequired(eq(ref("type"), v("required")));

      expect(schema.required).toEqual({
        type: "eq",
        left: { type: "_dref", path: "type" },
        right: { type: "st", value: "required" },
      });
    });

    it("sets default value", () => {
      const schema = str().setDefault("hello");
      expect(schema.default).toBe("hello");
    });

    it("sets coerce", () => {
      const schema = str().setCoerce();
      expect(schema.coerce).toBe(true);
    });

    it("sets private", () => {
      const schema = str().setPrivate();
      expect(schema.private).toBe(true);
    });

    it("adds conditional rules", () => {
      const schema = str().when({
        when: eq(ref("country"), v("US")),
        then: { type: "min_length", min: v(5) },
      });

      expect(schema.rules![0].type).toBe("conditional");
    });

    it("adds regex rule", () => {
      const schema = str().regex("^[a-z]+$", "i", "lowercase_only");

      expect(schema.rules![0]).toEqual({
        type: "regex",
        regex: "^[a-z]+$",
        flags: "i",
        code: "lowercase_only",
      });
    });

    it("adds oneOf rule", () => {
      const schema = str().oneOf([v("a"), v("b"), v("c")]);

      expect(schema.rules![0]).toEqual({
        type: "one_of",
        values: [
          { type: "st", value: "a" },
          { type: "st", value: "b" },
          { type: "st", value: "c" },
        ],
        code: undefined,
      });
    });

    it("is immutable - each method returns a new instance", () => {
      const schema1 = str();
      const schema2 = schema1.minLength(v(3));
      const schema3 = schema2.maxLength(v(100));

      expect(schema1.rules).toBeUndefined();
      expect(schema2.rules).toHaveLength(1);
      expect(schema3.rules).toHaveLength(2);
    });
  });

  describe("ObjectSchemaFluent", () => {
    it("creates an empty object schema", () => {
      const schema = obj();

      expect(schema.type).toBe("object");
      expect(schema.fields).toEqual({});
    });

    it("creates object with inline fields using string()", () => {
      // Use the regular string() builder for inline fields
      const schema = obj({
        name: string(),
        email: string({ rules: [email()] }),
      });

      expect(schema.type).toBe("object");
      expect(schema.fields.name.type).toBe("string");
      expect(schema.fields.email.type).toBe("string");
    });

    it("adds fields via fluent method", () => {
      const schema = obj()
        .field("name", string({ rules: [minLength(v(1))] }))
        .field("email", string({ rules: [email()] }));

      expect(schema.fields.name.type).toBe("string");
      expect(schema.fields.email.type).toBe("string");
      expect(schema.fields.name.rules).toHaveLength(1);
      expect(schema.fields.email.rules).toHaveLength(1);
    });

    it("adds multiple fields at once", () => {
      const schema = obj().addFields({
        name: string(),
        age: { type: "number" } as any,
      });

      expect(Object.keys(schema.fields)).toHaveLength(2);
    });

    it("supports nested objects", () => {
      const schema = obj()
        .field("name", string())
        .field(
          "address",
          object({
            fields: {
              street: string(),
              city: string(),
              zip: string({ rules: [{ type: "regex", regex: "^\\d{5}$" }] }),
            },
          })
        );

      expect(schema.fields.address.type).toBe("object");
      expect((schema.fields.address as any).fields.street.type).toBe("string");
      expect((schema.fields.address as any).fields.zip.rules).toHaveLength(1);
    });

    it("sets required property", () => {
      const schema = obj({ name: string() }).setRequired();
      expect(schema.required).toBe(true);
    });

    it("sets optional", () => {
      const schema = obj({ name: string() }).optional();
      expect(schema.required).toBe(false);
    });

    it("is immutable - each method returns a new instance", () => {
      const schema1 = obj();
      const schema2 = schema1.field("name", string());
      const schema3 = schema2.field("email", string());

      expect(Object.keys(schema1.fields)).toHaveLength(0);
      expect(Object.keys(schema2.fields)).toHaveLength(1);
      expect(Object.keys(schema3.fields)).toHaveLength(2);
    });
  });

  describe("Serialization", () => {
    it("string schema serializes to JSON correctly", () => {
      const schema = str().minLength(v(3)).maxLength(v(100)).setRequired();

      const json = JSON.stringify(schema);
      const parsed = JSON.parse(json);

      // Methods should not be in the JSON
      expect(parsed.minLength).toBeUndefined();
      expect(parsed.maxLength).toBeUndefined();
      expect(parsed.setRequired).toBeUndefined();

      // Data should be present
      expect(parsed.type).toBe("string");
      expect(parsed.required).toBe(true);
      expect(parsed.rules).toHaveLength(2);
      expect(parsed.rules[0]).toEqual({
        type: "min_length",
        min: { type: "st", value: 3 },
      });
    });

    it("object schema serializes to JSON correctly", () => {
      const schema = obj()
        .field("name", string({ rules: [minLength(v(1))] }))
        .field("email", string({ rules: [email()] }));

      const json = JSON.stringify(schema);
      const parsed = JSON.parse(json);

      // Methods should not be in the JSON
      expect(parsed.field).toBeUndefined();

      // Data should be present
      expect(parsed.type).toBe("object");
      expect(parsed.fields.name.type).toBe("string");
      expect(parsed.fields.email.rules[0].type).toBe("email");
    });

    it("nested object schema serializes correctly", () => {
      const schema = obj().field(
        "user",
        object({
          fields: {
            name: string({ required: true }),
            profile: object({
              fields: {
                bio: string({ rules: [maxLength(v(500))] }),
              },
            }),
          },
        })
      );

      const json = JSON.stringify(schema);
      const parsed = JSON.parse(json);

      expect(parsed.fields.user.fields.name.required).toBe(true);
      expect(parsed.fields.user.fields.profile.fields.bio.rules[0].type).toBe("max_length");
    });

    it("round-trip serialization preserves data", () => {
      const original = str()
        .minLength(v(3))
        .maxLength(ref("config.maxLen"))
        .setRequired(eq(ref("type"), v("required")));

      const json = JSON.stringify(original);
      const parsed = JSON.parse(json);

      // All data should match
      expect(parsed.type).toBe(original.type);
      expect(parsed.required).toEqual(original.required);
      expect(parsed.rules).toEqual(original.rules);
    });

    it("can rehydrate from JSON to fluent builder", () => {
      const original = str().minLength(v(3)).setRequired();

      // Serialize
      const json = JSON.stringify(original);
      const parsed = JSON.parse(json);

      // Rehydrate - wrap in str() to get methods back
      const rehydrated = str(parsed);

      // Can continue chaining
      const extended = rehydrated.maxLength(v(100));

      expect(extended.rules).toHaveLength(2);
      expect(extended.rules![1].type).toBe("max_length");
    });
  });

  describe("Equivalence with current API", () => {
    it("fluent string schema produces same data as object-based builder", () => {
      // Current object-based API
      const objectBased = string({
        rules: [minLength(v(3)), maxLength(v(100))],
        required: true,
      });

      // New fluent API
      const fluent = str().minLength(v(3)).maxLength(v(100)).setRequired();

      // Compare serialized output (ignoring method presence)
      expect(JSON.stringify(objectBased)).toBe(JSON.stringify(fluent));
    });

    it("fluent object schema produces same data as object-based builder", () => {
      // Current object-based API
      const objectBased = object({
        fields: {
          name: string({ rules: [minLength(v(1))] }),
          email: string({ rules: [email()] }),
        },
      });

      // New fluent API (using string() for fields to match types)
      const fluent = obj({
        name: string({ rules: [minLength(v(1))] }),
        email: string({ rules: [email()] }),
      });

      // Compare serialized output
      expect(JSON.stringify(objectBased)).toBe(JSON.stringify(fluent));
    });
  });

  describe("Type safety", () => {
    it("TypeScript correctly narrows rule types", () => {
      const schema = str().minLength(v(3)).email();

      // This should compile - rules array exists and has correct types
      const rules = schema.rules!;
      expect(rules[0].type).toBe("min_length");
      expect(rules[1].type).toBe("email");
    });

    it("TypeScript tracks field types in object schema", () => {
      const schema = obj()
        .field("name", string())
        .field("count", { type: "number" } as any);

      // TypeScript should know these fields exist
      expect(schema.fields.name.type).toBe("string");
      expect(schema.fields.count.type).toBe("number");
    });
  });

  describe("Methods are non-enumerable", () => {
    it("string schema methods are not enumerable", () => {
      const schema = str();
      const keys = Object.keys(schema);

      // Only data properties should be enumerable
      expect(keys).toContain("type");
      expect(keys).not.toContain("minLength");
      expect(keys).not.toContain("maxLength");
      expect(keys).not.toContain("setRequired");
    });

    it("object schema methods are not enumerable", () => {
      const schema = obj();
      const keys = Object.keys(schema);

      // Only data properties should be enumerable
      expect(keys).toContain("type");
      expect(keys).toContain("fields");
      expect(keys).not.toContain("field");
      expect(keys).not.toContain("setRequired");
    });
  });
});
