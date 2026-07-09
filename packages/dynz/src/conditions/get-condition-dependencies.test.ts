import { describe, expect, it } from "vitest";
import { and, eq, gt, gte, isIn, isNotIn, lt, lte, matches, neq, or, v } from "../functions";
import { ref } from "../reference";
import { discriminatedUnion, number, object, string } from "../schemas";
import { getConditionDependencies, getRulesDependenciesMap } from "./get-condition-dependencies";

// Root schema containing all fields referenced in getConditionDependencies tests
const rootSchema = object({
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
    setting: string(),
    promotionalAccess: string(),
    feature: string(),
  }),
  module: object({
    localSetting: string(),
    config: object({}),
  }),
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
      const schema = string().custom("myValidation", {
        threshold: ref("settings.threshold"),
        comparisonValue: ref("$.global.comparison"),
        staticValue: v("test"),
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
      const schema = string()
        .custom("validation1", {
          min: ref("$.limits.min"),
          max: ref("limits.max"),
        })
        .custom("validation2", {
          pattern: ref("$.pattern.regex"),
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
      const schema = string().custom("simpleValidation", {
        staticParam: v("value"),
        numericParam: v(42),
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
      const schema = string().equals(ref("confirmPassword"));

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
      const schema = string().oneOf([v("static"), ref("allowedValue1"), ref("$.global.allowedValue2")]);

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

  describe("discriminated union with a DynamicOptionValue discriminator", () => {
    // Members here intentionally have no fields besides the discriminator itself, so the only
    // possible source of a "$.kind.kind" dependency is the enabled predicate being tested —
    // members with other Schema fields independently make the discriminator key depend on
    // those fields too (see "tracks per-field dependencies" below).
    it("tracks the enabled predicate's references as dependencies of the discriminator key", () => {
      const schema = object({
        country: string(),
        kind: discriminatedUnion("kind", [
          { kind: { enabled: eq(ref("$.country"), v("NL")), value: "a" } },
          { kind: "b" },
        ]),
      });

      const result = getRulesDependenciesMap(schema, "$");

      expect(result.dependencies["$.kind.kind"]).toEqual(new Set(["$.country"]));
      expect(result.reverse["$.country"]).toContain("$.kind.kind");
    });

    it("does not add a dependency for a statically enabled/disabled discriminator", () => {
      const schema = object({
        kind: discriminatedUnion("kind", [{ kind: { enabled: true, value: "a" } }, { kind: "b" }]),
      });

      const result = getRulesDependenciesMap(schema, "$");

      expect(result.dependencies["$.kind.kind"]).toBeUndefined();
    });

    it("also tracks dependencies on the member's other Schema fields, merged with the enabled predicate's", () => {
      const schema = object({
        country: string(),
        kind: discriminatedUnion("kind", [
          { kind: { enabled: eq(ref("$.country"), v("NL")), value: "a" }, value: string() },
          { kind: "b", value: number() },
        ]),
      });

      const result = getRulesDependenciesMap(schema, "$");

      expect(result.dependencies["$.kind.kind"]).toEqual(new Set(["$.country", "$.kind.value"]));
    });
  });

  describe("a ref() pointing at a discriminator key path", () => {
    it("includes the ref itself plus the union's own included predicate's dependencies", () => {
      const schema = object({
        country: string(),
        union: discriminatedUnion("kind", [{ kind: "a", value: string() }]).setIncluded(eq(ref("country"), v("NL"))),
      });

      const condition = eq(ref("union.kind"), v("a"));
      const result = getConditionDependencies(condition, "$", schema);

      expect(result).toEqual(["$.union.kind", "$.country"]);
    });

    it("only includes the ref itself when the union has no conditional included predicate", () => {
      const schema = object({
        union: discriminatedUnion("kind", [{ kind: "a", value: string() }]),
      });

      const condition = eq(ref("union.kind"), v("a"));
      const result = getConditionDependencies(condition, "$", schema);

      expect(result).toEqual(["$.union.kind"]);
    });
  });
});
