import { describe, expect, it } from "vitest";
import { SchemaType } from "../types";
import { findPossibleSchemasByPath, findSchemaByPath } from "./find-schema-by-path";

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

  describe("call forms", () => {
    const schema = {
      type: SchemaType.OBJECT,
      fields: { name: { type: SchemaType.STRING } },
    };

    it("should accept the options form with a type but no values", () => {
      expect(findSchemaByPath("$.name", schema, { type: SchemaType.STRING })).toEqual({ type: SchemaType.STRING });
    });

    it("should assert the type from the options form", () => {
      expect(() => findSchemaByPath("$.name", schema, { type: SchemaType.NUMBER })).toThrow(
        "Expected schema of type number at path $.name, but got string"
      );
    });

    it("should accept an empty options object", () => {
      expect(findSchemaByPath("$.name", schema, {})).toEqual({ type: SchemaType.STRING });
    });

    it("should treat undefined values the same as omitting them", () => {
      expect(findSchemaByPath("$.name", schema, { values: undefined })).toEqual(findSchemaByPath("$.name", schema));
    });

    it("should agree across the positional and options forms", () => {
      expect(findSchemaByPath("$.name", schema, SchemaType.STRING)).toEqual(
        findSchemaByPath("$.name", schema, { type: SchemaType.STRING })
      );
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
    // Both members declare `amount`, with different schemas — the shape that resolves
    // to the wrong variant when there is nothing to narrow with.
    const expense = {
      type: SchemaType.DISCRIMINATED_UNION,
      key: "kind",
      schemas: [
        { kind: "hours", amount: { type: SchemaType.NUMBER }, project: { type: SchemaType.STRING } },
        { kind: "money", amount: { type: SchemaType.STRING }, receipt: { type: SchemaType.STRING } },
      ],
    };
    const root = {
      type: SchemaType.OBJECT,
      fields: { items: { type: SchemaType.ARRAY, schema: expense }, expense },
    };

    describe("without values", () => {
      it("should return the union schema for the discriminator key", () => {
        expect(findSchemaByPath("$.expense.kind", root)).toBe(expense);
      });

      it("should resolve a field only one member declares", () => {
        expect(findSchemaByPath("$.expense.receipt", root)).toEqual({ type: SchemaType.STRING });
      });

      it("should fall back to the first member that declares the field", () => {
        expect(findSchemaByPath("$.expense.amount", root)).toEqual({ type: SchemaType.NUMBER });
      });

      it("should throw when no member declares the field", () => {
        expect(() => findSchemaByPath("$.expense.iban", root)).toThrow("No schema found for path $.expense.iban");
      });
    });

    describe("with values", () => {
      it("should resolve each array element against its own variant", () => {
        const values = { items: [{ kind: "money" }, { kind: "hours" }] };

        expect(findSchemaByPath("$.items[0].amount", root, { values })).toEqual({ type: SchemaType.STRING });
        expect(findSchemaByPath("$.items[1].amount", root, { values })).toEqual({ type: SchemaType.NUMBER });
      });

      it("should resolve the member the values select", () => {
        expect(findSchemaByPath("$.expense.amount", root, { values: { expense: { kind: "money" } } })).toEqual({
          type: SchemaType.STRING,
        });
      });

      it("should still return the union schema for the discriminator key", () => {
        expect(findSchemaByPath("$.expense.kind", root, { values: { expense: { kind: "money" } } })).toBe(expense);
      });

      it("should resolve a field the selected member does not declare", () => {
        // Values are a tie-breaker, not a filter: adapters keep the outgoing variant's
        // fields mounted for a render while the discriminator changes.
        expect(findSchemaByPath("$.expense.receipt", root, { values: { expense: { kind: "hours" } } })).toEqual({
          type: SchemaType.STRING,
        });
      });

      it("should fall back to the scan when the discriminator matches no member", () => {
        expect(findSchemaByPath("$.expense.amount", root, { values: { expense: { kind: "mileage" } } })).toEqual({
          type: SchemaType.NUMBER,
        });
      });

      it("should not throw on a wrong-shaped value", () => {
        expect(findSchemaByPath("$.items[0].receipt", root, { values: { items: "not-an-array" } })).toEqual({
          type: SchemaType.STRING,
        });
      });

      it("should narrow a union nested inside a union", () => {
        const inner = {
          type: SchemaType.DISCRIMINATED_UNION,
          key: "unit",
          schemas: [
            { unit: "hour", rate: { type: SchemaType.NUMBER } },
            { unit: "day", rate: { type: SchemaType.STRING } },
          ],
        };
        const outer = {
          type: SchemaType.DISCRIMINATED_UNION,
          key: "kind",
          schemas: [{ kind: "hours", detail: inner }, { kind: "money" }],
        };
        const schema = { type: SchemaType.OBJECT, fields: { expense: outer } };
        const values = { expense: { kind: "hours", detail: { unit: "day" } } };

        expect(findSchemaByPath("$.expense.detail.rate", schema, { values })).toEqual({ type: SchemaType.STRING });
      });

      it("should take the discriminator from the union's own default", () => {
        const withUnionDefault = {
          type: SchemaType.OBJECT,
          fields: { expense: { ...expense, default: { kind: "money" } } },
        };

        expect(findSchemaByPath("$.expense.amount", withUnionDefault, { values: {} })).toEqual({
          type: SchemaType.STRING,
        });
      });

      it("should take the discriminator from an ancestor object's default", () => {
        const withObjectDefault = {
          type: SchemaType.OBJECT,
          fields: {
            claim: {
              type: SchemaType.OBJECT,
              fields: { expense },
              default: { expense: { kind: "money" } },
            },
          },
        };

        expect(findSchemaByPath("$.claim.expense.amount", withObjectDefault, { values: {} })).toEqual({
          type: SchemaType.STRING,
        });
      });

      it("should take the discriminator from an ancestor array's default", () => {
        const withArrayDefault = {
          type: SchemaType.OBJECT,
          fields: {
            items: { type: SchemaType.ARRAY, schema: expense, default: [{ kind: "money" }] },
          },
        };

        expect(findSchemaByPath("$.items[0].amount", withArrayDefault, { values: {} })).toEqual({
          type: SchemaType.STRING,
        });
      });

      it("should use the default discriminator when the union object omits it", () => {
        // A registered-but-unfilled union arrives as `{ amount: undefined }` — present, so
        // it is not replaced wholesale, yet it carries no discriminator of its own.
        const withUnionDefault = {
          type: SchemaType.OBJECT,
          fields: { expense: { ...expense, default: { kind: "money" } } },
        };

        expect(
          findSchemaByPath("$.expense.amount", withUnionDefault, { values: { expense: { amount: undefined } } })
        ).toEqual({ type: SchemaType.STRING });
      });

      it("should prefer a supplied value over the default", () => {
        const withUnionDefault = {
          type: SchemaType.OBJECT,
          fields: { expense: { ...expense, default: { kind: "money" } } },
        };

        expect(
          findSchemaByPath("$.expense.amount", withUnionDefault, { values: { expense: { kind: "hours" } } })
        ).toEqual({ type: SchemaType.NUMBER });
      });

      it("should apply the type assertion to the value-resolved member", () => {
        expect(
          findSchemaByPath("$.expense.amount", root, {
            type: SchemaType.STRING,
            values: { expense: { kind: "money" } },
          })
        ).toEqual({ type: SchemaType.STRING });

        expect(() =>
          findSchemaByPath("$.expense.amount", root, {
            type: SchemaType.NUMBER,
            values: { expense: { kind: "money" } },
          })
        ).toThrow("Expected schema of type number at path $.expense.amount, but got string");
      });

      it("should accept the positional type + values form", () => {
        const values = { expense: { kind: "money" } };

        expect(findSchemaByPath("$.expense.amount", root, SchemaType.STRING, values)).toEqual({
          type: SchemaType.STRING,
        });
      });

      it("should assert the type against the value-resolved member in the positional form", () => {
        // The shape every adapter uses, so the failing case matters as much as the happy one.
        expect(() =>
          findSchemaByPath("$.expense.amount", root, SchemaType.NUMBER, { expense: { kind: "money" } })
        ).toThrow("Expected schema of type number at path $.expense.amount, but got string");
      });

      it("should narrow on a numeric discriminator", () => {
        const versioned = {
          type: SchemaType.OBJECT,
          fields: {
            doc: {
              type: SchemaType.DISCRIMINATED_UNION,
              key: "version",
              schemas: [
                { version: 1, payload: { type: SchemaType.STRING } },
                { version: 2, payload: { type: SchemaType.NUMBER } },
              ],
            },
          },
        };

        expect(findSchemaByPath("$.doc.payload", versioned, { values: { doc: { version: 2 } } })).toEqual({
          type: SchemaType.NUMBER,
        });
      });

      it("should narrow on a boolean discriminator", () => {
        const flagged = {
          type: SchemaType.OBJECT,
          fields: {
            doc: {
              type: SchemaType.DISCRIMINATED_UNION,
              key: "draft",
              schemas: [
                { draft: true, payload: { type: SchemaType.STRING } },
                { draft: false, payload: { type: SchemaType.NUMBER } },
              ],
            },
          },
        };

        expect(findSchemaByPath("$.doc.payload", flagged, { values: { doc: { draft: false } } })).toEqual({
          type: SchemaType.NUMBER,
        });
      });
    });
  });

  describe("findPossibleSchemasByPath", () => {
    const expense = {
      type: SchemaType.DISCRIMINATED_UNION,
      key: "kind",
      schemas: [
        { kind: "hours", amount: { type: SchemaType.NUMBER }, project: { type: SchemaType.STRING } },
        { kind: "money", amount: { type: SchemaType.STRING } },
      ],
    };
    const root = { type: SchemaType.OBJECT, fields: { items: { type: SchemaType.ARRAY, schema: expense } } };

    it("should return one schema per variant rather than only the first", () => {
      expect(findPossibleSchemasByPath("$.items[0].amount", root)).toEqual([
        { type: SchemaType.NUMBER },
        { type: SchemaType.STRING },
      ]);
    });

    it("should return the single variant that declares the field", () => {
      expect(findPossibleSchemasByPath("$.items[0].project", root)).toEqual([{ type: SchemaType.STRING }]);
    });

    it("should return one schema for a path that crosses no union", () => {
      const schema = { type: SchemaType.OBJECT, fields: { name: { type: SchemaType.STRING } } };

      expect(findPossibleSchemasByPath("$.name", schema)).toEqual([{ type: SchemaType.STRING }]);
    });

    it("should return the union schema when variants declare the field as a literal", () => {
      const union = {
        type: SchemaType.DISCRIMINATED_UNION,
        key: "kind",
        schemas: [
          { kind: "hours", version: 1 },
          { kind: "money", version: 2 },
        ],
      };

      // A literal has no schema of its own, so every variant resolves to the union node
      // and the differing values collapse to a single entry.
      expect(findPossibleSchemasByPath("$.version", union)).toEqual([union]);
    });

    it("should return the union schema for the discriminator key", () => {
      const union = {
        type: SchemaType.DISCRIMINATED_UNION,
        key: "kind",
        schemas: [
          { kind: "hours", amount: { type: SchemaType.NUMBER } },
          { kind: "money", amount: { type: SchemaType.STRING } },
        ],
      };

      expect(findPossibleSchemasByPath("$.kind", union)).toEqual([union]);
    });

    it("should collapse variants that share the same schema object", () => {
      const shared = { type: SchemaType.STRING };
      const union = {
        type: SchemaType.DISCRIMINATED_UNION,
        key: "kind",
        schemas: [
          { kind: "hours", note: shared },
          { kind: "money", note: shared },
        ],
      };

      expect(findPossibleSchemasByPath("$.note", union)).toEqual([shared]);
    });

    it("should keep resolving when only one variant leads anywhere", () => {
      // `detail` is an object on one variant and absent on the other; the dead branch
      // must not sink the lookup.
      const union = {
        type: SchemaType.DISCRIMINATED_UNION,
        key: "kind",
        schemas: [
          { kind: "hours", detail: { type: SchemaType.OBJECT, fields: { note: { type: SchemaType.STRING } } } },
          { kind: "money", receipt: { type: SchemaType.STRING } },
        ],
      };

      expect(findPossibleSchemasByPath("$.detail.note", union)).toEqual([{ type: SchemaType.STRING }]);
    });

    it("should throw when traversing past a leaf schema", () => {
      const schema = { type: SchemaType.OBJECT, fields: { name: { type: SchemaType.STRING } } };

      expect(() => findPossibleSchemasByPath("$.name.first", schema)).toThrow(
        "Cannot find schema at path $.name.first"
      );
    });

    it("should throw for a non-numeric array index", () => {
      expect(() => findPossibleSchemasByPath("$.items.oops", root)).toThrow(
        "Expected an array index at path $.items.oops, but got oops"
      );
    });

    it("should throw when no variant declares the field", () => {
      expect(() => findPossibleSchemasByPath("$.items[0].iban", root)).toThrow(
        "No schema found for path $.items[0].iban"
      );
    });
  });
});
