import { describe, expect, it } from "vitest";
import { SchemaType } from "../types";
import { getNested } from "./get-nested";

describe("getNested", () => {
  describe("private schema access", () => {
    it("should throw error when root schema is private", () => {
      const schema = {
        type: SchemaType.STRING,
        private: true,
      };
      const value = "test";

      expect(() => getNested("$.field", schema, value)).toThrow("Cannot access private schema at path $.field");
    });

    it("should throw error when nested field is private", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          secret: {
            type: SchemaType.STRING,
            private: true,
          },
        },
      };
      const value = { secret: "hidden" };

      expect(() => getNested("$.secret", schema, value)).toThrow("Cannot access private schema at path $.secret");
    });

    it("should throw error when array element schema is private", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          items: {
            type: SchemaType.ARRAY,
            schema: {
              type: SchemaType.STRING,
              private: true,
            },
          },
        },
      };
      const value = { items: ["item1", "item2"] };

      expect(() => getNested("$.items[0]", schema, value)).toThrow("Cannot access private schema at path $.items[0]");
    });
  });

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

    it("should throw error when field does not exist in schema", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          existing: {
            type: SchemaType.STRING,
          },
        },
      };
      const value = { existing: "value" };

      expect(() => getNested("$.nonexistent", schema, value)).toThrow("No schema found for path $.nonexistent");
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

    it("should return default value when array element is undefined", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          items: {
            type: SchemaType.ARRAY,
            schema: {
              type: SchemaType.STRING,
              default: "default",
            },
            default: ["default"],
          },
        },
      };
      const value = { items: [undefined] };

      const result = getNested("$.items[0]", schema, value);

      expect(result).toEqual({
        schema: { type: SchemaType.STRING, default: "default" },
        value: ["default"], // This returns the schema.default (the array), not the element default
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

  describe("error cases", () => {
    it("should throw error when trying to traverse non-object, non-array", () => {
      const schema = {
        type: SchemaType.STRING,
      };
      const value = "string value";

      expect(() => getNested("$.field", schema, value)).toThrow("Cannot get nested value on non array or non object");
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
