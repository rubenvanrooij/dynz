import { describe, expect, it } from "vitest";
import { ref } from "../reference";
import { array } from "../schemas/array/builder";
import { object } from "../schemas/object/builder";
import { string } from "../schemas/string/builder";
import { conditional } from "../rules/conditional-rule";
import { custom } from "../rules/custom-rule";
import { equals } from "../rules/equals-rule";
import { minEntries } from "../rules/min-entries-rule";
import { minLength } from "../rules/min-length-rule";
import { oneOf } from "../rules/one-off-rule";
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
    expect(result).toEqual({
      dependencies: {},
      reverse: {},
    });
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
      dependencies: {
        "$.field": new Set(["$.enabled"]),
      },
      reverse: {
        "$.enabled": new Set(["$.field"]),
      },
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
      dependencies: {
        "$.email": new Set(["$.validate", "$.global.strict", "$.format"]),
      },
      reverse: {
        "$.validate": new Set(["$.email"]),
        "$.global.strict": new Set(["$.email"]),
        "$.format": new Set(["$.email"]),
      },
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
      dependencies: {
        "$.user.name": new Set(["$.user.required"]),
        "$.user.age": new Set(["$.global.validateAge"]),
      },
      reverse: {
        "$.user.required": new Set(["$.user.name"]),
        "$.global.validateAge": new Set(["$.user.age"]),
      },
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
      dependencies: {
        "$.items": new Set(["$.validateArray"]),
        "$.items.[]": new Set(["$.items.validateItems"]),
      },
      reverse: {
        "$.validateArray": new Set(["$.items"]),
        "$.items.validateItems": new Set(["$.items.[]"]),
      },
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
      dependencies: {
        "$.user": new Set(["$.validateUser"]),
        "$.user.profile.email": new Set(["$.user.profile.emailRequired", "$.global.forceEmail"]),
      },
      reverse: {
        "$.validateUser": new Set(["$.user"]),
        "$.user.profile.emailRequired": new Set(["$.user.profile.email"]),
        "$.global.forceEmail": new Set(["$.user.profile.email"]),
      },
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
      dependencies: {
        $: new Set(["$.enabled"]),
      },
      reverse: {
        "$.enabled": new Set(["$"]),
      },
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
      dependencies: {
        "$.user.email": new Set(["$.user.emailRequired"]),
      },
      reverse: {
        "$.user.emailRequired": new Set(["$.user.email"]),
      },
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
      dependencies: {
        "$.validation": new Set(["$.method1", "$.method2", "$.method3", "$.global.allowMethod3"]),
      },
      reverse: {
        "$.method1": new Set(["$.validation"]),
        "$.method2": new Set(["$.validation"]),
        "$.method3": new Set(["$.validation"]),
        "$.global.allowMethod3": new Set(["$.validation"]),
      },
    });
  });

  describe("custom rules with references", () => {
    it("should extract dependencies from custom rule parameters", () => {
      const schema = string({
        rules: [
          custom("myValidation", {
            threshold: ref("settings.threshold"),
            comparisonValue: ref("$.global.comparison"),
            staticValue: "test",
          }),
        ],
      });

      const result = getRulesDependenciesMap(schema, "$.field");

      expect(result).toEqual({
        dependencies: {
          "$.field": new Set(["$.settings.threshold", "$.global.comparison"]),
        },
        reverse: {
          "$.settings.threshold": new Set(["$.field"]),
          "$.global.comparison": new Set(["$.field"]),
        },
      });
    });

    it("should handle multiple custom rules with mixed references", () => {
      const schema = string({
        rules: [
          custom("validation1", {
            min: ref("$.limits.min"),
            max: ref("limits.max"),
          }),
          custom("validation2", {
            pattern: ref("$.pattern.regex"),
          }),
        ],
      });

      const result = getRulesDependenciesMap(schema, "$.input");

      expect(result).toEqual({
        dependencies: {
          "$.input": new Set(["$.limits.min", "$.limits.max", "$.pattern.regex"]),
        },
        reverse: {
          "$.limits.min": new Set(["$.input"]),
          "$.limits.max": new Set(["$.input"]),
          "$.pattern.regex": new Set(["$.input"]),
        },
      });
    });

    it("should handle custom rules without any references", () => {
      const schema = string({
        rules: [
          custom("simpleValidation", {
            staticParam: "value",
            numericParam: 42,
          }),
        ],
      });

      const result = getRulesDependenciesMap(schema, "$.field");

      expect(result).toEqual({
        dependencies: {},
        reverse: {},
      });
    });
  });

  describe("other rules with references", () => {
    it("should extract dependencies from equals rule with reference", () => {
      const schema = string({
        rules: [equals(ref("confirmPassword"))],
      });

      const result = getRulesDependenciesMap(schema, "$.password");

      expect(result).toEqual({
        dependencies: {
          "$.password": new Set(["$.confirmPassword"]),
        },
        reverse: {
          "$.confirmPassword": new Set(["$.password"]),
        },
      });
    });

    it("should extract dependencies from oneOf rule with references", () => {
      const schema = string({
        rules: [oneOf(["static", ref("allowedValue1"), ref("$.global.allowedValue2")])],
      });

      const result = getRulesDependenciesMap(schema, "$.choice");

      expect(result).toEqual({
        dependencies: {
          "$.choice": new Set(["$.allowedValue1", "$.global.allowedValue2"]),
        },
        reverse: {
          "$.allowedValue1": new Set(["$.choice"]),
          "$.global.allowedValue2": new Set(["$.choice"]),
        },
      });
    });

    it("should handle multiple rules with different reference patterns", () => {
      const schema = string({
        rules: [
          equals(ref("$.settings.expectedValue")),
          oneOf([ref("option1"), ref("option2")]),
          conditional({
            when: eq("enabled", true),
            then: custom("complexValidation", {
              reference1: ref("data.ref1"),
              reference2: ref("$.global.ref2"),
            }),
          }),
        ],
      });

      const result = getRulesDependenciesMap(schema, "$.field");

      expect(result).toEqual({
        dependencies: {
          "$.field": new Set([
            "$.settings.expectedValue",
            "$.option1",
            "$.option2",
            "$.enabled",
            "$.data.ref1",
            "$.global.ref2",
          ]),
        },
        reverse: {
          "$.settings.expectedValue": new Set(["$.field"]),
          "$.option1": new Set(["$.field"]),
          "$.option2": new Set(["$.field"]),
          "$.enabled": new Set(["$.field"]),
          "$.data.ref1": new Set(["$.field"]),
          "$.global.ref2": new Set(["$.field"]),
        },
      });
    });
  });

  describe("reverse dependency map", () => {
    it("should correctly build reverse dependencies for complex scenarios", () => {
      const schema = object({
        fields: {
          email: string({
            rules: [
              conditional({
                when: eq("emailRequired", true),
                then: minLength(1),
              }),
            ],
          }),
          password: string({
            rules: [
              conditional({
                when: eq("emailRequired", true),
                then: minLength(8),
              }),
            ],
          }),
          confirmPassword: string({
            rules: [equals(ref("password"))],
          }),
        },
      });

      const result = getRulesDependenciesMap(schema, "$.form");

      expect(result.reverse).toEqual({
        "$.form.emailRequired": new Set(["$.form.email", "$.form.password"]),
        "$.form.password": new Set(["$.form.confirmPassword"]),
      });
    });

    it("should handle global references affecting multiple fields", () => {
      const schema = object({
        fields: {
          field1: string({
            rules: [
              conditional({
                when: eq("$.global.strictMode", true),
                then: minLength(5),
              }),
            ],
          }),
          field2: string({
            rules: [
              conditional({
                when: eq("$.global.strictMode", true),
                then: minLength(10),
              }),
            ],
          }),
          field3: string({
            rules: [
              custom("validation", {
                mode: ref("$.global.strictMode"),
              }),
            ],
          }),
        },
      });

      const result = getRulesDependenciesMap(schema, "$.form");

      expect(result.reverse["$.global.strictMode"]).toEqual(
        new Set(["$.form.field1", "$.form.field2", "$.form.field3"])
      );
    });
  });
});
