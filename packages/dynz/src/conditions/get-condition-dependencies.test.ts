import { describe, expect, it } from "vitest";
import { array } from "../schemas/array/builder";
import { object } from "../schemas/object/builder";
import { string } from "../schemas/string/builder";
import { conditional } from "../rules/conditional-rule";
import { minEntries } from "../rules/min-entries-rule";
import { minLength } from "../rules/min-length-rule";
import { and, or, eq, neq, gt, gte, lt, lte, matches, isIn, isNotIn } from "./builder";
import { getConditionDependencies, getRulesDependenciesMap } from "./get-condition-dependencies";

describe("getConditionDependencies", () => {
  describe("simple conditions", () => {
    it("should return single dependency for equals condition", () => {
      const condition = eq("email", "test@example.com");
      const result = getConditionDependencies(condition, "$.user");

      expect(result).toEqual(["$.email"]);
    });

    it("should handle all comparison condition types", () => {
      const testCases = [
        { condition: neq("status", "inactive"), expected: "status" },
        { condition: gt("age", 18), expected: "age" },
        { condition: gte("score", 80), expected: "score" },
        { condition: lt("price", 100), expected: "price" },
        { condition: lte("limit", 50), expected: "limit" },
        { condition: matches("phone", "^\\+[1-9]\\d{1,14}$"), expected: "phone" },
        { condition: isIn("role", ["admin", "user"]), expected: "role" },
        { condition: isNotIn("status", ["banned", "suspended"]), expected: "status" },
      ];

      testCases.forEach(({ condition, expected }) => {
        const result = getConditionDependencies(condition, "$.test");
        expect(result).toEqual([`$.${expected}`]);
      });
    });

    it("should handle absolute paths correctly", () => {
      const condition = eq("$.global.setting", true);
      const result = getConditionDependencies(condition, "$.local.field");

      expect(result).toEqual(["$.global.setting"]);
    });
  });

  describe("AND conditions", () => {
    it("should return dependencies from all nested conditions", () => {
      const condition = and(eq("name", "John"), gt("age", 21), isIn("role", ["admin", "user"]));

      const result = getConditionDependencies(condition, "$.user");

      expect(result).toEqual(["$.name", "$.age", "$.role"]);
    });

    it("should handle nested AND conditions", () => {
      const condition = and(eq("active", true), and(gt("score", 80), eq("verified", true)));

      const result = getConditionDependencies(condition, "$.user");

      expect(result).toEqual(["$.active", "$.score", "$.verified"]);
    });

    it("should handle empty AND conditions", () => {
      const condition = and();
      const result = getConditionDependencies(condition, "$.user");
      expect(result).toEqual([]);
    });
  });

  describe("OR conditions", () => {
    it("should return dependencies from all nested conditions", () => {
      const condition = or(eq("type", "premium"), gt("points", 1000));

      const result = getConditionDependencies(condition, "$.account");

      expect(result).toEqual(["$.type", "$.points"]);
    });

    it("should handle complex nested logical conditions", () => {
      const condition = and(eq("enabled", true), or(and(eq("role", "admin"), gt("level", 5)), eq("trusted", true)));

      const result = getConditionDependencies(condition, "$.user");

      expect(result).toEqual(["$.enabled", "$.role", "$.level", "$.trusted"]);
    });

    it("should handle mixed absolute and relative paths", () => {
      const condition = and(eq("$.global.feature", true), eq("localSetting", "enabled"));

      const result = getConditionDependencies(condition, "$.module.config");

      expect(result).toEqual(["$.global.feature", "$.module.localSetting"]);
    });
  });

  describe("deeply nested structures", () => {
    it("should handle complex combinations", () => {
      const condition = or(
        and(eq("userType", "premium"), gt("subscriptionMonths", 12)),
        and(eq("userType", "enterprise"), or(gt("teamSize", 50), eq("hasContract", true))),
        eq("$.global.promotionalAccess", true)
      );

      const result = getConditionDependencies(condition, "$.account");

      expect(result).toEqual([
        "$.userType",
        "$.subscriptionMonths",
        "$.userType",
        "$.teamSize",
        "$.hasContract",
        "$.global.promotionalAccess",
      ]);
    });
  });
});

describe("getRulesDependenciesMap", () => {
  it("should return empty object for schema without rules", () => {
    const schema = string();
    const result = getRulesDependenciesMap(schema);
    expect(result).toEqual({});
  });

  it("should return dependencies for schema with conditional rules", () => {
    const schema = string({
      rules: [
        conditional({
          when: eq("enabled", true),
          then: minLength(1),
        }),
      ],
    });

    const result = getRulesDependenciesMap(schema, "$.field");

    expect(result).toEqual({
      "$.field": ["$.enabled"],
    });
  });

  it("should handle multiple conditional rules with complex conditions", () => {
    const schema = string({
      rules: [
        conditional({
          when: and(eq("validate", true), eq("$.global.strict", true)),
          then: minLength(1),
        }),
        conditional({
          when: eq("format", "email"),
          then: minLength(5),
        }),
      ],
    });

    const result = getRulesDependenciesMap(schema, "$.email");

    expect(result).toEqual({
      "$.email": ["$.validate", "$.global.strict", "$.format"],
    });
  });

  it("should handle object schema with nested field dependencies", () => {
    const schema = object({
      fields: {
        name: string({
          rules: [
            conditional({
              when: eq("required", true),
              then: minLength(1),
            }),
          ],
        }),
        age: string({
          rules: [
            conditional({
              when: eq("$.global.validateAge", true),
              then: minLength(1),
            }),
          ],
        }),
        email: string(),
      },
    });

    const result = getRulesDependenciesMap(schema, "$.user");

    expect(result).toEqual({
      "$.user.name": ["$.user.required"],
      "$.user.age": ["$.global.validateAge"],
    });
  });

  it("should handle array schema dependencies", () => {
    const schema = array({
      schema: string({
        rules: [
          conditional({
            when: eq("validateItems", true),
            then: minLength(1),
          }),
        ],
      }),
      rules: [
        conditional({
          when: eq("validateArray", true),
          then: minLength(1),
        }),
      ],
    });

    const result = getRulesDependenciesMap(schema, "$.items");

    expect(result).toEqual({
      "$.items": ["$.validateArray"],
      "$.items.[]": ["$.items.validateItems"],
    });
  });

  it("should handle complex nested structures", () => {
    const schema = object({
      fields: {
        profile: object({
          fields: {
            email: string({
              rules: [
                conditional({
                  when: or(eq("emailRequired", true), eq("$.global.forceEmail", true)),
                  then: minLength(1),
                }),
              ],
            }),
          },
        }),
        tags: array({
          schema: string(),
        }),
      },
      rules: [
        conditional({
          when: eq("validateUser", true),
          then: minEntries(1),
        }),
      ],
    });

    const result = getRulesDependenciesMap(schema, "$.user");

    expect(result).toEqual({
      "$.user": ["$.validateUser"],
      "$.user.profile.email": ["$.user.profile.emailRequired", "$.global.forceEmail"],
    });
  });

  it("should use default path when not provided", () => {
    const schema = string({
      rules: [
        conditional({
          when: eq("enabled", true),
          then: minLength(1),
        }),
      ],
    });

    const result = getRulesDependenciesMap(schema);

    expect(result).toEqual({
      $: ["$.enabled"],
    });
  });

  it("should only include fields with conditional rules", () => {
    const schema = object({
      fields: {
        name: string({
          rules: [minLength(1)],
        }),
        email: string({
          rules: [
            conditional({
              when: eq("emailRequired", true),
              then: minLength(1),
            }),
          ],
        }),
        age: string(),
      },
    });

    const result = getRulesDependenciesMap(schema, "$.user");

    expect(result).toEqual({
      "$.user.email": ["$.user.emailRequired"],
    });
  });

  it("should handle OR conditions with multiple paths", () => {
    const schema = string({
      rules: [
        conditional({
          when: or(
            eq("method1", "active"),
            eq("method2", "active"),
            and(eq("method3", "active"), eq("$.global.allowMethod3", true))
          ),
          then: minLength(1),
        }),
      ],
    });

    const result = getRulesDependenciesMap(schema, "$.validation");

    expect(result).toEqual({
      "$.validation": ["$.method1", "$.method2", "$.method3", "$.global.allowMethod3"],
    });
  });
});
