import { describe, expect, it } from "vitest";
import { and, eq, gt, gte, isIn, isNotIn, lt, lte, matches, neq, or, v } from "../functions";
import { ref } from "../reference";
import { custom } from "../rules/custom-rule";
import { equals } from "../rules/equals-rule";
import { oneOf } from "../rules/one-off-rule";
import { object } from "../schemas/object/builder";
import { string } from "../schemas/string/builder";
import { getConditionDependencies, getRulesDependenciesMap } from "./get-condition-dependencies";

// Root schema containing all fields referenced in getConditionDependencies tests
const rootSchema = object({
  fields: {
    email: string(),
    status: string(),
    age: string(),
    score: string(),
    price: string(),
    limit: string(),
    phone: string(),
    role: string(),
    name: string(),
    active: string(),
    verified: string(),
    enabled: string(),
    type: string(),
    points: string(),
    trusted: string(),
    userType: string(),
    subscriptionMonths: string(),
    teamSize: string(),
    hasContract: string(),
    level: string(),
    global: object({
      fields: {
        setting: string(),
        promotionalAccess: string(),
        feature: string(),
      },
    }),
    module: object({
      fields: {
        localSetting: string(),
        config: object({ fields: {} }),
      },
    }),
  },
});

describe("getConditionDependencies", () => {
  describe("simple conditions", () => {
    it("should return single dependency for equals condition", () => {
      const condition = eq(ref("email"), v("test@example.com"));
      const result = getConditionDependencies(condition, "$.user", rootSchema);

      expect(result).toEqual(["$.email"]);
    });

    it("should handle all comparison condition types", () => {
      const testCases = [
        { condition: neq(ref("status"), v("inactive")), expected: "status" },
        { condition: gt(ref("age"), v(18)), expected: "age" },
        { condition: gte(ref("score"), v(80)), expected: "score" },
        { condition: lt(ref("price"), v(100)), expected: "price" },
        { condition: lte(ref("limit"), v(50)), expected: "limit" },
        {
          condition: matches(ref("phone"), v("^\\+[1-9]\\d{1,14}$")),
          expected: "phone",
        },
        {
          condition: isIn(ref("role"), v(["admin", "user"])),
          expected: "role",
        },
        {
          condition: isNotIn(ref("status"), v(["banned", "suspended"])),
          expected: "status",
        },
      ];

      testCases.forEach(({ condition, expected }) => {
        const result = getConditionDependencies(condition, "$.test", rootSchema);
        expect(result).toEqual([`$.${expected}`]);
      });
    });

    it("should handle absolute paths correctly", () => {
      const condition = eq(ref("$.global.setting"), v(true));
      const result = getConditionDependencies(condition, "$.local.field", rootSchema);

      expect(result).toEqual(["$.global.setting"]);
    });
  });

  describe("AND conditions", () => {
    it("should return dependencies from all nested conditions", () => {
      const condition = and(eq(ref("name"), v("John")), gt(ref("age"), v(21)), isIn(ref("role"), v(["admin", "user"])));

      const result = getConditionDependencies(condition, "$.user", rootSchema);

      expect(result).toEqual(["$.name", "$.age", "$.role"]);
    });

    it("should handle nested AND conditions", () => {
      const condition = and(eq(ref("active"), v(true)), and(gt(ref("score"), v(80)), eq(ref("verified"), v(true))));

      const result = getConditionDependencies(condition, "$.user", rootSchema);

      expect(result).toEqual(["$.active", "$.score", "$.verified"]);
    });

    it("should handle empty AND conditions", () => {
      const condition = and();
      const result = getConditionDependencies(condition, "$.user", rootSchema);
      expect(result).toEqual([]);
    });
  });

  describe("OR conditions", () => {
    it("should return dependencies from all nested conditions", () => {
      const condition = or(eq(ref("type"), v("premium")), gt(ref("points"), v(1000)));

      const result = getConditionDependencies(condition, "$.account", rootSchema);

      expect(result).toEqual(["$.type", "$.points"]);
    });

    it("should handle complex nested logical conditions", () => {
      const condition = and(
        eq(ref("enabled"), v(true)),
        or(and(eq(ref("role"), v("admin")), gt(ref("level"), v(5))), eq(ref("trusted"), v(true)))
      );

      const result = getConditionDependencies(condition, "$.user", rootSchema);

      expect(result).toEqual(["$.enabled", "$.role", "$.level", "$.trusted"]);
    });

    it("should handle mixed absolute and relative paths", () => {
      const condition = and(eq(ref("$.global.feature"), v(true)), eq(ref("localSetting"), v("enabled")));

      const result = getConditionDependencies(condition, "$.module.config", rootSchema);

      expect(result).toEqual(["$.global.feature", "$.module.localSetting"]);
    });
  });

  describe("deeply nested structures", () => {
    it("should handle complex combinations", () => {
      const condition = or(
        and(eq(ref("userType"), v("premium")), gt(ref("subscriptionMonths"), v(12))),
        and(eq(ref("userType"), v("enterprise")), or(gt(ref("teamSize"), v(50)), eq(ref("hasContract"), v(true)))),
        eq(ref("$.global.promotionalAccess"), v(true))
      );

      const result = getConditionDependencies(condition, "$.account", rootSchema);

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

  describe("custom rules with references", () => {
    it("should extract dependencies from custom rule parameters", () => {
      const schema = string({
        rules: [
          custom("myValidation", {
            threshold: ref("settings.threshold"),
            comparisonValue: ref("$.global.comparison"),
            staticValue: v("test"),
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
            staticParam: v("value"),
            numericParam: v(42),
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
        rules: [oneOf([v("static"), ref("allowedValue1"), ref("$.global.allowedValue2")])],
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
  });
});
