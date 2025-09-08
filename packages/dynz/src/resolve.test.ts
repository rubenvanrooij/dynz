import { describe, expect, it } from "vitest";
import { eq } from "./conditions";
import {
  findSchemaByPath,
  getNested,
  isIncluded,
  isMutable,
  isReference,
  isRequired,
  type ResolveContext,
  resolveCondition,
  resolveProperty,
  resolveRules,
  unpackRef,
  unpackRefValue,
} from "./resolve";
import { conditional, equals, max, min, ref } from "./rules";
import { array, number, object, string } from "./schema";
import { type Condition, ConditionType, type Reference, RuleType, SchemaType } from "./types";

describe("resolve", () => {
  describe("isRequired", () => {
    it("should return true for required field", () => {
      const schema = string({ required: true });
      const result = isRequired(schema, "$", {});

      expect(result).toBe(true);
    });

    it("should return false for optional field", () => {
      const schema = string({ required: false });
      const result = isRequired(schema, "$", {});

      expect(result).toBe(false);
    });

    it("should return default true when required is undefined", () => {
      const schema = string();
      const result = isRequired(schema, "$", {});

      expect(result).toBe(true);
    });

    it("should resolve conditional required based on other field", () => {
      const schema = object({
        fields: {
          type: string(),
          email: string({
            required: eq("type", "user"),
          }),
        },
      });

      const requiredResult = isRequired(schema, "$.email", { type: "user" });
      expect(requiredResult).toBe(true);

      const notRequiredResult = isRequired(schema, "$.email", { type: "admin" });
      expect(notRequiredResult).toBe(false);
    });
  });

  describe("isIncluded", () => {
    it("should return true for included field", () => {
      const schema = string({ included: true });
      const result = isIncluded(schema, "$", {});

      expect(result).toBe(true);
    });

    it("should return false for excluded field", () => {
      const schema = string({ included: false });
      const result = isIncluded(schema, "$", {});

      expect(result).toBe(false);
    });

    it("should return default true when included is undefined", () => {
      const schema = string();
      const result = isIncluded(schema, "$", {});

      expect(result).toBe(true);
    });
  });

  describe("isMutable", () => {
    it("should return true for mutable field", () => {
      const schema = string({ mutable: true });
      const result = isMutable(schema, "$", {});

      expect(result).toBe(true);
    });

    it("should return false for immutable field", () => {
      const schema = string({ mutable: false });
      const result = isMutable(schema, "$", {});

      expect(result).toBe(false); // Note: there's a bug in the implementation - it checks 'required' instead of 'mutable'
    });
  });

  describe("resolveProperty", () => {
    it("should return boolean value when property is boolean", () => {
      const schema = string({ required: true });
      const context: ResolveContext = {
        schema,
        values: { new: {} },
      };

      const result = resolveProperty(schema, "required", "$", false, context);
      expect(result).toBe(true);
    });

    it("should return default value when property is undefined", () => {
      const schema = string();
      const context: ResolveContext = {
        schema,
        values: { new: {} },
      };

      const result = resolveProperty(schema, "required", "$", false, context);
      expect(result).toBe(false);
    });

    it("should resolve condition when property is condition", () => {
      const condition: Condition = {
        type: ConditionType.EQUALS,
        path: "$.type",
        value: "user",
      };

      const schema = string({ required: condition });
      const rootSchema = object({
        fields: {
          type: string(),
          email: schema,
        },
      });

      const context: ResolveContext = {
        schema: rootSchema,
        values: { new: { type: "user" } },
      };

      const result = resolveProperty(schema, "required", "$.email", false, context);
      expect(result).toBe(true);
    });
  });

  describe("resolveCondition", () => {
    const createContext = (values: unknown): ResolveContext => ({
      schema: object({
        fields: {
          type: string(),
          age: number(),
          tags: array({ schema: string() }),
        },
      }),
      values: { new: values },
    });

    describe("AND condition", () => {
      it("should return true when all conditions are true", () => {
        const condition: Condition = {
          type: ConditionType.AND,
          conditions: [
            { type: ConditionType.EQUALS, path: "$.type", value: "user" },
            { type: ConditionType.GREATHER_THAN, path: "$.age", value: 18 },
          ],
        };

        const result = resolveCondition(condition, "$", createContext({ type: "user", age: 25 }));
        expect(result).toBe(true);
      });

      it("should return false when any condition is false", () => {
        const condition: Condition = {
          type: ConditionType.AND,
          conditions: [
            { type: ConditionType.EQUALS, path: "$.type", value: "user" },
            { type: ConditionType.GREATHER_THAN, path: "$.age", value: 18 },
          ],
        };

        const result = resolveCondition(condition, "$", createContext({ type: "user", age: 16 }));
        expect(result).toBe(false);
      });
    });

    describe("OR condition", () => {
      it("should return true when any condition is true", () => {
        const condition: Condition = {
          type: ConditionType.OR,
          conditions: [
            { type: ConditionType.EQUALS, path: "$.type", value: "admin" },
            { type: ConditionType.GREATHER_THAN, path: "$.age", value: 65 },
          ],
        };

        const result = resolveCondition(condition, "$", createContext({ type: "user", age: 70 }));
        expect(result).toBe(true);
      });

      it("should return false when all conditions are false", () => {
        const condition: Condition = {
          type: ConditionType.OR,
          conditions: [
            { type: ConditionType.EQUALS, path: "$.type", value: "admin" },
            { type: ConditionType.GREATHER_THAN, path: "$.age", value: 65 },
          ],
        };

        const result = resolveCondition(condition, "$", createContext({ type: "user", age: 30 }));
        expect(result).toBe(false);
      });
    });

    describe("comparison conditions", () => {
      it("should handle EQUALS condition", () => {
        const condition: Condition = {
          type: ConditionType.EQUALS,
          path: "$.type",
          value: "user",
        };

        const result = resolveCondition(condition, "$", createContext({ type: "user" }));
        expect(result).toBe(true);
      });

      it("should handle GREATHER_THAN condition", () => {
        const condition: Condition = {
          type: ConditionType.GREATHER_THAN,
          path: "$.age",
          value: 18,
        };

        const result = resolveCondition(condition, "$", createContext({ age: 25 }));
        expect(result).toBe(true);
      });

      it("should handle LOWER_THAN condition", () => {
        const condition: Condition = {
          type: ConditionType.LOWER_THAN,
          path: "$.age",
          value: 65,
        };

        const result = resolveCondition(condition, "$", createContext({ age: 30 }));
        expect(result).toBe(true);
      });
    });

    describe("MATCHES condition", () => {
      it("should match string against regex pattern", () => {
        const condition: Condition = {
          type: ConditionType.MATCHES,
          path: "$.type",
          value: "^user.*",
        };

        const result = resolveCondition(condition, "$", createContext({ type: "user_admin" }));
        expect(result).toBe(true);
      });

      it("should not match when pattern does not match", () => {
        const condition: Condition = {
          type: ConditionType.MATCHES,
          path: "$.type",
          value: "^admin.*",
        };

        const result = resolveCondition(condition, "$", createContext({ type: "user_admin" }));
        expect(result).toBe(false);
      });
    });

    describe("IS_IN condition", () => {
      it("should return true when value is in array", () => {
        const condition: Condition = {
          type: ConditionType.IS_IN,
          path: "$.type",
          value: ["user", "admin", "guest"],
        };

        const result = resolveCondition(condition, "$", createContext({ type: "admin" }));
        expect(result).toBe(true);
      });

      it("should return false when value is not in array", () => {
        const condition: Condition = {
          type: ConditionType.IS_IN,
          path: "$.type",
          value: ["user", "admin"],
        };

        const result = resolveCondition(condition, "$", createContext({ type: "guest" }));
        expect(result).toBe(false);
      });
    });

    describe("IS_NOT_IN condition", () => {
      it("should return true when value is not in array", () => {
        const condition: Condition = {
          type: ConditionType.IS_NOT_IN,
          path: "$.type",
          value: ["guest", "anonymous"],
        };

        const result = resolveCondition(condition, "$", createContext({ type: "user" }));
        expect(result).toBe(true);
      });

      it("should return false when value is in array", () => {
        const condition: Condition = {
          type: ConditionType.IS_NOT_IN,
          path: "$.type",
          value: ["user", "admin"],
        };

        const result = resolveCondition(condition, "$", createContext({ type: "user" }));
        expect(result).toBe(false);
      });
    });
  });

  describe("resolveRules", () => {
    it("should return all rules when no conditions", () => {
      const schema = string({
        rules: [min(3), max(10), equals("test")],
      });

      const context: ResolveContext = {
        schema,
        values: { new: {} },
      };

      const rules = resolveRules(schema, "$", context);
      expect(rules).toHaveLength(3);
      expect(rules[0].type).toBe(RuleType.MIN);
      expect(rules[1].type).toBe(RuleType.MAX);
      expect(rules[2].type).toBe(RuleType.EQUALS);
    });

    it("should filter conditional rules based on condition result", () => {
      const conditionalRule = conditional({
        when: {
          type: ConditionType.EQUALS,
          path: "$.type",
          value: "email",
        },
        then: min(5),
      });

      const schema = string({
        rules: [max(10), conditionalRule],
      });

      const rootSchema = object({
        fields: {
          type: string(),
          value: schema,
        },
      });

      const context: ResolveContext = {
        schema: rootSchema,
        values: { new: { type: "email" } },
      };

      const rules = resolveRules(schema, "$.value", context);
      expect(rules).toHaveLength(2);
      expect(rules[0].type).toBe(RuleType.MAX);
      expect(rules[1].type).toBe(RuleType.MIN);
    });

    it("should exclude conditional rules when condition is false", () => {
      const conditionalRule = conditional({
        when: {
          type: ConditionType.EQUALS,
          path: "$.type",
          value: "email",
        },
        then: min(5),
      });

      const schema = string({
        rules: [max(10), conditionalRule],
      });

      const rootSchema = object({
        fields: {
          type: string(),
          value: schema,
        },
      });

      const context: ResolveContext = {
        schema: rootSchema,
        values: { new: { type: "text" } },
      };

      const rules = resolveRules(schema, "$.value", context);
      expect(rules).toHaveLength(1);
      expect(rules[0].type).toBe(RuleType.MAX);
    });
  });

  describe("isReference", () => {
    it("should return true for reference object", () => {
      const reference: Reference = {
        type: "__reference",
        path: "$.other",
      };

      expect(isReference(reference)).toBe(true);
    });

    it("should return false for non-reference values", () => {
      expect(isReference("string")).toBe(false);
      expect(isReference(42)).toBe(false);
      expect(isReference({ type: "other" })).toBe(false);
      expect(isReference(null)).toBe(false);
    });
  });

  describe("unpackRefValue and unpackRef", () => {
    const schema = object({
      fields: {
        min: number(),
        value: string(),
      },
    });

    const context: ResolveContext = {
      schema,
      values: { new: { min: 5, value: "hello" } },
    };

    it("should return static value for non-reference", () => {
      const result = unpackRefValue("static", "$.value", context);
      expect(result).toBe("static");

      const refResult = unpackRef("static", "$.value", context);
      expect(refResult).toEqual({
        value: "static",
        static: true,
      });
    });

    it("should resolve reference to actual value", () => {
      const reference = ref("min");
      const result = unpackRefValue(reference, "$.value", context);
      expect(result).toBe(5);

      const refResult = unpackRef(reference, "$.value", context);
      expect(refResult).toEqual({
        schema: expect.objectContaining({ type: SchemaType.NUMBER }),
        value: 5,
        static: false,
      });
    });

    it("should resolve absolute path reference", () => {
      const reference = ref("$.min");
      const result = unpackRefValue(reference, "$.value", context);
      expect(result).toBe(5);
    });
  });

  describe("findSchemaByPath", () => {
    const schema = object({
      fields: {
        user: object({
          fields: {
            name: string(),
            contacts: array({
              schema: object({
                fields: {
                  type: string(),
                  value: string(),
                },
              }),
            }),
          },
        }),
      },
    });

    it("should find schema at simple path", () => {
      const foundSchema = findSchemaByPath("$.user.name", schema);
      expect(foundSchema.type).toBe(SchemaType.STRING);
    });

    it("should find schema at nested object path", () => {
      const foundSchema = findSchemaByPath("$.user", schema);
      expect(foundSchema.type).toBe(SchemaType.OBJECT);
    });

    it("should find schema in array", () => {
      const foundSchema = findSchemaByPath("$.user.contacts[0].type", schema);
      expect(foundSchema.type).toBe(SchemaType.STRING);
    });

    it("should validate schema type when provided", () => {
      const foundSchema = findSchemaByPath("$.user.name", schema, SchemaType.STRING);
      expect(foundSchema.type).toBe(SchemaType.STRING);
    });

    it("should throw error when schema type does not match", () => {
      expect(() => {
        findSchemaByPath("$.user.name", schema, SchemaType.NUMBER);
      }).toThrow("Expected schema of type number at path $.user.name, but got string");
    });

    it("should throw error for invalid path", () => {
      expect(() => {
        findSchemaByPath("$.user.invalid", schema);
      }).toThrow("No schema found for path $.user.invalid");
    });
  });

  describe("getNested", () => {
    const schema = object({
      fields: {
        user: object({
          fields: {
            name: string(),
            age: number(),
            contacts: array({
              schema: string(),
            }),
          },
        }),
      },
    });

    it("should get nested value at simple path", () => {
      const values = { user: { name: "John", age: 30 } };
      const result = getNested("$.user.name", schema, values);

      expect(result).toEqual({
        schema: expect.objectContaining({ type: SchemaType.STRING }),
        value: "John",
      });
    });

    it("should get nested value in array", () => {
      const values = { user: { contacts: ["email@test.com", "phone"] } };
      const result = getNested("$.user.contacts[0]", schema, values);

      expect(result).toEqual({
        schema: expect.objectContaining({ type: SchemaType.STRING }),
        value: "email@test.com",
      });
    });

    it("should throw error for private schema access", () => {
      const privateSchema = object({
        fields: {
          secret: string({ private: true }),
        },
      });

      expect(() => {
        getNested("$.secret", privateSchema, { secret: "value" });
      }).toThrow("Cannot access private schema at path $.secret");
    });

    it("should throw error when array index is not a number", () => {
      expect(() => {
        getNested("$.user.contacts[invalid]", schema, { user: { contacts: {} } });
      }).toThrow("Expected an array at path $.user.contacts[invalid], but got object");
    });

    it("should throw error for invalid path structure", () => {
      expect(() => {
        getNested("$.user.name.invalid", schema, { user: { name: "John" } });
      }).toThrow("Cannot get nested value on non array or non object");
    });
  });
});
