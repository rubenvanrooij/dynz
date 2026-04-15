import { describe, expect, it } from "vitest";
import { eq, sum, v } from "../functions";
import { ref } from "../reference";
import { object, string } from "../schemas";

describe("Fluent API", () => {
  describe("StringSchemaFluent", () => {
    it("creates a basic string schema", () => {
      const schema = string();

      expect(schema.type).toBe("string");
      // rules is an empty array initially, not undefined
      expect(schema.rules).toEqual([]);
    });

    it("adds min rule via fluent method", () => {
      const schema = string().min(3);

      expect(schema.type).toBe("string");
      expect(schema.rules).toHaveLength(1);
      expect(schema.rules[0]).toEqual({
        type: "min_length",
        min: { type: "st", value: 3 },
        code: undefined,
      });
    });

    it("chains multiple rules", () => {
      const schema = string().min(3).max(100).email();

      expect(schema.rules).toHaveLength(3);
      expect(schema.rules[0].type).toBe("min_length");
      expect(schema.rules[1].type).toBe("max_length");
      expect(schema.rules[2].type).toBe("email");
    });

    it("supports references in rules", () => {
      const schema = string().min(ref("config.minLen"));

      expect(schema.rules[0]).toEqual({
        type: "min_length",
        min: { type: "_dref", path: "config.minLen" },
        code: undefined,
      });
    });

    it("supports transformers in rules (the key benefit!)", () => {
      // This is the main benefit: sum() is the TRANSFORMER, .min is the RULE
      // Clear separation: methods are rules, imports are functions
      const schema = string().min(sum(ref("a"), ref("b")));

      expect(schema.rules[0]).toEqual({
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

    it("sets required property with value", () => {
      const schema = string().setRequired(true);
      expect(schema.required).toBe(true);

      const schema2 = string().setRequired(false);
      expect(schema2.required).toBe(false);
    });

    it("sets optional (required: false)", () => {
      const schema = string().optional();
      expect(schema.required).toBe(false);
    });

    it("supports predicate for required", () => {
      const schema = string().setRequired(eq(ref("type"), v("required")));

      expect(schema.required).toEqual({
        type: "eq",
        left: { type: "_dref", path: "type" },
        right: { type: "st", value: "required" },
      });
    });

    it("sets default value", () => {
      const schema = string().setDefault("hello");
      expect(schema.default).toBe("hello");
    });

    it("sets coerce with value", () => {
      const schema = string().setCoerce(true);
      expect(schema.coerce).toBe(true);
    });

    it("sets private with value", () => {
      const schema = string().setPrivate(true);
      expect(schema.private).toBe(true);
    });

    it("adds conditional rules with callback", () => {
      const schema = string().when(eq(ref("country"), v("US")), (b) => b.min(5));

      // The when() callback adds conditional rules
      expect(schema.rules).toHaveLength(1);
      expect(schema.rules[0].type).toBe("conditional");
    });

    it("adds regex rule", () => {
      const schema = string().regex("^[a-z]+$", "i", "lowercase_only");

      expect(schema.rules[0]).toEqual({
        type: "regex",
        regex: "^[a-z]+$",
        flags: "i",
        code: "lowercase_only",
      });
    });

    it("adds oneOf rule", () => {
      const schema = string().oneOf([v("a"), v("b"), v("c")]);

      expect(schema.rules[0]).toEqual({
        type: "one_of",
        values: [
          { type: "st", value: "a" },
          { type: "st", value: "b" },
          { type: "st", value: "c" },
        ],
        code: undefined,
      });
    });

    it("adds custom rule", () => {
      const schema = string().custom("myValidator", { threshold: v(10) });

      expect(schema.rules[0]).toEqual({
        type: "custom",
        name: "myValidator",
        params: { threshold: v(10) },
        code: undefined,
      });
    });

    it("is immutable - each method returns a new instance", () => {
      const schema1 = string();
      const schema2 = schema1.min(3);
      const schema3 = schema2.max(100);

      expect(schema1.rules).toEqual([]);
      expect(schema2.rules).toHaveLength(1);
      expect(schema3.rules).toHaveLength(2);
    });
  });

  describe("ObjectSchemaFluent", () => {
    it("creates an object schema with fields", () => {
      const schema = object({
        name: string(),
        email: string().email(),
      });

      expect(schema.type).toBe("object");
      expect(schema.fields.name.type).toBe("string");
      expect(schema.fields.email.type).toBe("string");
    });

    it("sets required property with value", () => {
      const schema = object({ name: string() }).setRequired(true);
      expect(schema.required).toBe(true);
    });

    it("sets optional", () => {
      const schema = object({ name: string() }).optional();
      expect(schema.required).toBe(false);
    });

    it("supports nested objects", () => {
      const schema = object({
        name: string(),
        address: object({
          street: string(),
          city: string(),
          zip: string().regex("^\\d{5}$"),
        }),
      });

      expect(schema.fields.address.type).toBe("object");
      expect(schema.fields.address.fields.street.type).toBe("string");
      expect(schema.fields.address.fields.zip.rules).toHaveLength(1);
    });
  });

  describe("Serialization", () => {
    it("string schema serializes to JSON correctly", () => {
      const schema = string().min(3).max(100).setRequired(true);

      const json = JSON.stringify(schema);
      const parsed = JSON.parse(json);

      // Data should be present
      expect(parsed.type).toBe("string");
      expect(parsed.required).toBe(true);
      expect(parsed.rules).toHaveLength(2);
      expect(parsed.rules[0]).toEqual({
        type: "min_length",
        min: { type: "st", value: 3 },
        code: undefined,
      });
    });

    it("round-trip serialization preserves data", () => {
      const original = string()
        .min(3)
        .max(ref("config.maxLen"))
        .setRequired(eq(ref("type"), v("required")));

      const json = JSON.stringify(original);
      const parsed = JSON.parse(json);

      // All data should match
      expect(parsed.type).toBe(original.type);
      expect(parsed.required).toEqual(original.required);
      expect(parsed.rules).toEqual(original.rules);
    });
  });

  describe("Equivalence with current API", () => {
    it("fluent string schema produces expected structure", () => {
      // Build schema using fluent API
      const fluent = string().min(3).max(100).setRequired(true);

      // Verify structure
      expect(fluent.type).toBe("string");
      expect(fluent.required).toBe(true);
      expect(fluent.rules).toHaveLength(2);
      expect(fluent.rules[0].type).toBe("min_length");
      expect(fluent.rules[1].type).toBe("max_length");
    });

    it("fluent object schema produces expected structure", () => {
      // Build schema using fluent API
      const fluent = object({
        name: string().min(1),
        email: string().email(),
      });

      // Verify structure
      expect(fluent.type).toBe("object");
      expect(fluent.fields.name.type).toBe("string");
      expect(fluent.fields.email.type).toBe("string");
      expect(fluent.fields.name.rules[0].type).toBe("min_length");
      expect(fluent.fields.email.rules[0].type).toBe("email");
    });
  });

  describe("Type safety", () => {
    it("TypeScript correctly narrows rule types", () => {
      const schema = string().min(3).email();

      const rules = schema.rules;
      expect(rules[0].type).toBe("min_length");
      expect(rules[1].type).toBe("email");
    });
  });
});
