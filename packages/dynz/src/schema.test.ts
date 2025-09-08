import { describe, expect, it } from "vitest";
import { equals, max, min } from "./rules";
import {
  array,
  boolean,
  date,
  // rules,
  DEFAULT_DATE_STRING_FORMAT,
  dateString,
  file,
  number,
  object,
  optional,
  options,
  required,
  string,
} from "./schema";
import { SchemaType } from "./types";

describe("schema", () => {
  describe("string", () => {
    it("should create basic string schema", () => {
      const schema = string();

      expect(schema).toEqual({
        type: SchemaType.STRING,
      });
    });

    it("should create string schema with options", () => {
      const schema = string({
        required: true,
        default: "hello",
        rules: [min(3), max(10)],
      });

      expect(schema).toEqual({
        type: SchemaType.STRING,
        required: true,
        default: "hello",
        rules: [
          { type: "min", min: 3 },
          { type: "max", max: 10 },
        ],
      });
    });

    it("should create string schema with all properties", () => {
      const schema = string({
        required: false,
        mutable: true,
        included: false,
        private: true,
        default: "test",
      });

      expect(schema).toEqual({
        type: SchemaType.STRING,
        required: false,
        mutable: true,
        included: false,
        private: true,
        default: "test",
      });
    });
  });

  describe("number", () => {
    it("should create basic number schema", () => {
      const schema = number();

      expect(schema).toEqual({
        type: SchemaType.NUMBER,
      });
    });

    it("should create number schema with options", () => {
      const schema = number({
        required: true,
        default: 42,
        rules: [min(0), max(100)],
      });

      expect(schema).toEqual({
        type: SchemaType.NUMBER,
        required: true,
        default: 42,
        rules: [
          { type: "min", min: 0 },
          { type: "max", max: 100 },
        ],
      });
    });

    it("should create number schema with validation rules", () => {
      const schema = number({
        rules: [min(18), max(65), equals(25)],
      });

      expect(schema.type).toBe(SchemaType.NUMBER);
      expect(schema.rules).toHaveLength(3);
      expect(schema.rules?.[0]).toEqual({ type: "min", min: 18 });
      expect(schema.rules?.[1]).toEqual({ type: "max", max: 65 });
      expect(schema.rules?.[2]).toEqual({ type: "equals", value: 25 });
    });
  });

  describe("boolean", () => {
    it("should create basic boolean schema", () => {
      const schema = boolean();

      expect(schema).toEqual({
        type: SchemaType.BOOLEAN,
      });
    });

    it("should create boolean schema with options", () => {
      const schema = boolean({
        required: true,
      });

      expect(schema).toEqual({
        type: SchemaType.BOOLEAN,
        required: true,
      });
    });

    it("should create boolean schema with all properties", () => {
      const schema = boolean({
        required: false,
        mutable: true,
        included: false,
        private: true,
      });

      expect(schema).toEqual({
        type: SchemaType.BOOLEAN,
        required: false,
        mutable: true,
        included: false,
        private: true,
      });
    });
  });

  describe("file", () => {
    it("should create basic file schema", () => {
      const schema = file();

      expect(schema).toEqual({
        type: SchemaType.FILE,
      });
    });

    it("should create file schema with options", () => {
      const schema = file({
        required: true,
        mutable: false,
      });

      expect(schema).toEqual({
        type: SchemaType.FILE,
        required: true,
        mutable: false,
      });
    });

    it("should create file schema with all properties", () => {
      const schema = file({
        required: false,
        mutable: true,
        included: true,
        private: false,
      });

      expect(schema).toEqual({
        type: SchemaType.FILE,
        required: false,
        mutable: true,
        included: true,
        private: false,
      });
    });
  });

  describe("options", () => {
    it("should create options schema with string options", () => {
      const schema = options({
        options: ["apple", "banana", "orange"],
      });

      expect(schema).toEqual({
        type: SchemaType.OPTIONS,
        options: ["apple", "banana", "orange"],
      });
    });

    it("should create options schema with number options", () => {
      const schema = options({
        options: [1, 2, 3, 4, 5],
        required: true,
      });

      expect(schema).toEqual({
        type: SchemaType.OPTIONS,
        options: [1, 2, 3, 4, 5],
        required: true,
      });
    });

    it("should create options schema with all properties", () => {
      const schema = options({
        options: ["small", "medium", "large"],
        required: false,
        mutable: true,
        included: true,
        private: false,
        default: "medium",
      });

      expect(schema).toEqual({
        type: SchemaType.OPTIONS,
        options: ["small", "medium", "large"],
        required: false,
        mutable: true,
        included: true,
        private: false,
        default: "medium",
      });
    });
  });

  describe("object", () => {
    it("should create object schema with fields", () => {
      const schema = object({
        fields: {
          name: string(),
          age: number(),
        },
      });

      expect(schema).toEqual({
        type: SchemaType.OBJECT,
        fields: {
          name: { type: SchemaType.STRING },
          age: { type: SchemaType.NUMBER },
        },
      });
    });

    it("should create object schema with nested objects", () => {
      const schema = object({
        fields: {
          user: object({
            fields: {
              profile: object({
                fields: {
                  name: string(),
                  email: string(),
                },
              }),
            },
          }),
        },
      });

      expect(schema.type).toBe(SchemaType.OBJECT);
      expect(schema.fields.user.type).toBe(SchemaType.OBJECT);
      expect(schema.fields.user.fields.profile.type).toBe(SchemaType.OBJECT);
      expect(schema.fields.user.fields.profile.fields.name.type).toBe(SchemaType.STRING);
    });

    it("should create object schema with mixed field types", () => {
      const schema = object({
        fields: {
          id: number(),
          name: string(),
          tags: array({ schema: string() }),
          metadata: object({ fields: {} }),
        },
        required: false,
      });

      expect(schema).toEqual({
        type: SchemaType.OBJECT,
        required: false,
        fields: {
          id: { type: SchemaType.NUMBER },
          name: { type: SchemaType.STRING },
          tags: { type: SchemaType.ARRAY, schema: { type: SchemaType.STRING } },
          metadata: { type: SchemaType.OBJECT, fields: {} },
        },
      });
    });
  });

  describe("array", () => {
    it("should create array schema with string items", () => {
      const schema = array({
        schema: string(),
      });

      expect(schema).toEqual({
        type: SchemaType.ARRAY,
        schema: { type: SchemaType.STRING },
      });
    });

    it("should create array schema with number items", () => {
      const schema = array({
        schema: number(),
        rules: [min(1), max(5)],
      });

      expect(schema).toEqual({
        type: SchemaType.ARRAY,
        schema: { type: SchemaType.NUMBER },
        rules: [
          { type: "min", min: 1 },
          { type: "max", max: 5 },
        ],
      });
    });

    it("should create array schema with object items", () => {
      const schema = array({
        schema: object({
          fields: {
            id: number(),
            name: string(),
          },
        }),
      });

      expect(schema.type).toBe(SchemaType.ARRAY);
      expect(schema.schema.type).toBe(SchemaType.OBJECT);
      expect(schema.schema.fields).toEqual({
        id: { type: SchemaType.NUMBER },
        name: { type: SchemaType.STRING },
      });
    });

    it("should create nested array schema", () => {
      const schema = array({
        schema: array({
          schema: string(),
        }),
      });

      expect(schema).toEqual({
        type: SchemaType.ARRAY,
        schema: {
          type: SchemaType.ARRAY,
          schema: { type: SchemaType.STRING },
        },
      });
    });
  });

  describe("date", () => {
    it("should create basic date schema", () => {
      const schema = date();

      expect(schema).toEqual({
        type: SchemaType.DATE,
      });
    });

    it("should create date schema with options", () => {
      const schema = date({
        required: true,
        default: new Date("2024-01-01"),
      });

      expect(schema).toEqual({
        type: SchemaType.DATE,
        required: true,
        default: new Date("2024-01-01"),
      });
    });

    it("should create date schema with coercion enabled", () => {
      const schema = date({
        coerce: true,
      });

      expect(schema).toEqual({
        type: SchemaType.DATE,
        coerce: true,
      });
    });

    it("should create date schema with all properties", () => {
      const schema = date({
        required: false,
        mutable: true,
        included: true,
        private: false,
        coerce: true,
        default: new Date("2023-12-25"),
      });

      expect(schema).toEqual({
        type: SchemaType.DATE,
        required: false,
        mutable: true,
        included: true,
        private: false,
        coerce: true,
        default: new Date("2023-12-25"),
      });
    });

    it("should create date schema with validation rules", () => {
      const minDate = new Date("2020-01-01");
      const maxDate = new Date("2030-12-31");
      const equalDate = new Date("2024-06-15");

      const schema = date({
        rules: [min(minDate), max(maxDate), equals(equalDate)],
      });

      expect(schema.type).toBe(SchemaType.DATE);
      expect(schema.rules).toHaveLength(3);
      expect(schema.rules?.[0]).toEqual({ type: "min", min: minDate });
      expect(schema.rules?.[1]).toEqual({ type: "max", max: maxDate });
      expect(schema.rules?.[2]).toEqual({ type: "equals", value: equalDate });
    });
  });

  describe("dateString", () => {
    it("should create date string schema with default format", () => {
      const schema = dateString();

      expect(schema).toEqual({
        type: SchemaType.DATE_STRING,
        format: DEFAULT_DATE_STRING_FORMAT,
      });
    });

    it("should create date string schema with custom format", () => {
      const schema = dateString({
        format: "MM/dd/yyyy",
      });

      expect(schema).toEqual({
        type: SchemaType.DATE_STRING,
        format: "MM/dd/yyyy",
      });
    });

    it("should create date string schema with format and other options", () => {
      const schema = dateString({
        format: "dd-MM-yyyy",
        required: true,
        default: "01-01-2024",
      });

      expect(schema).toEqual({
        type: SchemaType.DATE_STRING,
        format: "dd-MM-yyyy",
        required: true,
        default: "01-01-2024",
      });
    });

    it("should use default format when format is not provided in options", () => {
      const schema = dateString({
        required: false,
      });

      expect(schema).toEqual({
        type: SchemaType.DATE_STRING,
        format: DEFAULT_DATE_STRING_FORMAT,
        required: false,
      });
    });
  });

  describe("helper functions", () => {
    describe("optional", () => {
      it("should make schema optional", () => {
        const baseSchema = string({ required: true });
        const optionalSchema = optional(baseSchema);

        expect(optionalSchema).toEqual({
          type: SchemaType.STRING,
          required: false,
        });
      });

      it("should override required property", () => {
        const baseSchema = number({ required: true, default: 0 });
        const optionalSchema = optional(baseSchema);

        expect(optionalSchema).toEqual({
          type: SchemaType.NUMBER,
          required: false,
          default: 0,
        });
      });
    });

    describe("required", () => {
      it("should make schema required", () => {
        const baseSchema = string({ required: false });
        const requiredSchema = required(baseSchema);

        expect(requiredSchema).toEqual({
          type: SchemaType.STRING,
          required: true,
        });
      });

      it("should override required property", () => {
        const baseSchema = number({ required: false, mutable: true });
        const requiredSchema = required(baseSchema);

        expect(requiredSchema).toEqual({
          type: SchemaType.NUMBER,
          required: true,
          mutable: true,
        });
      });
    });
  });

  describe("complex schema compositions", () => {
    it("should create complex nested schema structure", () => {
      const userSchema = object({
        fields: {
          id: number({ required: true }),
          name: string({ required: true, rules: [min(2), max(50)] }),
          email: optional(string({ rules: [{ type: "regex", regex: "^[^@]+@[^@]+$" }] })),
          addresses: array({
            schema: object({
              fields: {
                street: string({ required: true }),
                city: string({ required: true }),
                country: string({ default: "US" }),
              },
            }),
            rules: [max(3)],
          }),
          createdAt: dateString({
            format: "yyyy-MM-dd",
            required: true,
          }),
        },
      });

      expect(userSchema.type).toBe(SchemaType.OBJECT);
      expect(userSchema.fields.id.required).toBe(true);
      expect(userSchema.fields.name.rules).toHaveLength(2);
      expect(userSchema.fields.email.required).toBe(false);
      expect(userSchema.fields.addresses.type).toBe(SchemaType.ARRAY);
      expect(userSchema.fields.addresses.schema.type).toBe(SchemaType.OBJECT);
      expect(userSchema.fields.createdAt.format).toBe("yyyy-MM-dd");
    });

    it("should handle schemas with conditional properties", () => {
      const schema = object({
        fields: {
          type: string(),
          conditionalField: string({
            required: {
              type: "eq" as const,
              path: "type",
              value: "special",
            },
          }),
        },
      });

      expect(schema.fields.conditionalField.required).toEqual({
        type: "eq",
        path: "type",
        value: "special",
      });
    });
  });
});
