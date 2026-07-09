import { describe, expect, it } from "vitest";
import { DISCRIMINATOR_TYPE } from "../schemas";
import { SchemaType } from "../types";
import { DISCRIMINATOR_KEY_TYPE, findSchemaByPath } from "./find-schema-by-path";

describe("findSchemaByPath", () => {
  describe("object schema traversal", () => {
    it("should find nested field in object schema", () => {
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

      const result = findSchemaByPath("$.user.name", schema);

      expect(result).toEqual({
        type: SchemaType.STRING,
      });
    });

    it("should find deeply nested field", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          level1: {
            type: SchemaType.OBJECT,
            fields: {
              level2: {
                type: SchemaType.OBJECT,
                fields: {
                  level3: {
                    type: SchemaType.NUMBER,
                  },
                },
              },
            },
          },
        },
      };

      const result = findSchemaByPath("$.level1.level2.level3", schema);

      expect(result).toEqual({
        type: SchemaType.NUMBER,
      });
    });

    it("should throw error when field does not exist in object", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          existing: {
            type: SchemaType.STRING,
          },
        },
      };

      expect(() => findSchemaByPath("$.nonexistent", schema)).toThrow("No schema found for path $.nonexistent");
    });
  });

  describe("array schema traversal", () => {
    it("should find schema for array element", () => {
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

      const result = findSchemaByPath("$.items[0]", schema);

      expect(result).toEqual({
        type: SchemaType.STRING,
      });
    });

    it("should find nested object in array", () => {
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

      const result = findSchemaByPath("$.users[0].name", schema);

      expect(result).toEqual({
        type: SchemaType.STRING,
      });
    });

    it("should throw error for non-numeric array index", () => {
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

      expect(() => findSchemaByPath("$.items[invalid]", schema)).toThrow(
        "Expected an array index at path $.items[invalid], but got invalid"
      );
    });
  });

  describe("mixed object and array traversal", () => {
    it("should handle complex nested structure", () => {
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
                        settings: {
                          type: SchemaType.ARRAY,
                          schema: {
                            type: SchemaType.BOOLEAN,
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

      const result = findSchemaByPath("$.data.users[0].profile.settings[1]", schema);

      expect(result).toEqual({
        type: SchemaType.BOOLEAN,
      });
    });
  });

  describe("type validation", () => {
    it("should return schema when type matches", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          name: {
            type: SchemaType.STRING,
          },
        },
      };

      const result = findSchemaByPath("$.name", schema, SchemaType.STRING);

      expect(result).toEqual({
        type: SchemaType.STRING,
      });
    });

    it("should throw error when type does not match", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          name: {
            type: SchemaType.STRING,
          },
        },
      };

      expect(() => findSchemaByPath("$.name", schema, SchemaType.NUMBER)).toThrow(
        "Expected schema of type number at path $.name, but got string"
      );
    });
  });

  describe("error cases", () => {
    it("should throw error when trying to traverse non-object, non-array schema", () => {
      const schema = {
        type: SchemaType.STRING,
      };

      expect(() => findSchemaByPath("$.field", schema)).toThrow("Cannot find schema at path $.field");
    });

    it("should throw error for empty path segments", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {},
      };

      // This tests the filter(Boolean) behavior
      expect(() => findSchemaByPath("$..field", schema)).toThrow("No schema found for path $..field");
    });
  });

  describe("root schema access", () => {
    it("should return root schema when path has no nested parts", () => {
      const schema = {
        type: SchemaType.STRING,
      };

      const result = findSchemaByPath("$", schema);

      expect(result).toEqual(schema);
    });
  });

  describe("discriminated union traversal", () => {
    it("should return a DiscriminatorKey collecting every member's discriminator for the key path", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          union: {
            type: SchemaType.DISCRIMINATED_UNION,
            key: "kind",
            schemas: [
              { kind: { type: DISCRIMINATOR_TYPE, value: "a" }, value: { type: SchemaType.STRING } },
              { kind: { type: DISCRIMINATOR_TYPE, value: "b" }, value: { type: SchemaType.NUMBER } },
            ],
          },
        },
      };

      const result = findSchemaByPath("$.union.kind", schema);

      expect(result).toEqual({
        type: DISCRIMINATOR_KEY_TYPE,
        key: "kind",
        discriminators: [
          { type: DISCRIMINATOR_TYPE, value: "a" },
          { type: DISCRIMINATOR_TYPE, value: "b" },
        ],
        included: undefined,
        required: undefined,
        mutable: undefined,
      });
    });

    it("carries over the union's own included/required/mutable onto the DiscriminatorKey", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          union: {
            type: SchemaType.DISCRIMINATED_UNION,
            key: "kind",
            included: true,
            required: false,
            mutable: true,
            schemas: [
              { kind: { type: DISCRIMINATOR_TYPE, value: "a", enabled: true }, value: { type: SchemaType.STRING } },
            ],
          },
        },
      };

      const result = findSchemaByPath("$.union.kind", schema);

      expect(result).toMatchObject({ included: true, required: false, mutable: true });
    });

    it("throws when explicitly asked for a discriminated_union but the path resolves to the discriminator key", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          union: {
            type: SchemaType.DISCRIMINATED_UNION,
            key: "kind",
            schemas: [{ kind: { type: DISCRIMINATOR_TYPE, value: "a" }, value: { type: SchemaType.STRING } }],
          },
        },
      };

      expect(() => findSchemaByPath("$.union.kind", schema, SchemaType.DISCRIMINATED_UNION)).toThrow(
        "Expected schema of type discriminated_union at path $.union.kind, but got discriminator_key"
      );
    });

    it("should find a member's field schema", () => {
      const schema = {
        type: SchemaType.OBJECT,
        fields: {
          union: {
            type: SchemaType.DISCRIMINATED_UNION,
            key: "kind",
            schemas: [
              { kind: { type: DISCRIMINATOR_TYPE, value: "a", enabled: true }, value: { type: SchemaType.STRING } },
            ],
          },
        },
      };

      const result = findSchemaByPath("$.union.value", schema);

      expect(result).toEqual({ type: SchemaType.STRING });
    });
  });
});
