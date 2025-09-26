import { describe, expect, it } from "vitest";
import { and, ConditionType, eq, gt, gte, isIn, isNotIn, lt, lte, matches, neq, or } from "./conditions";
import { REFERENCE_TYPE, ref } from "./reference";

describe("conditions", () => {
  describe("logical conditions", () => {
    describe("and", () => {
      it("should create AND condition with multiple conditions", () => {
        const condition = and(eq("$.name", "John"), gt("$.age", 18));

        expect(condition).toEqual({
          type: ConditionType.AND,
          conditions: [
            {
              type: ConditionType.EQUALS,
              path: "$.name",
              value: "John",
            },
            {
              type: ConditionType.GREATHER_THAN,
              path: "$.age",
              value: 18,
            },
          ],
        });
      });

      it("should create AND condition with single condition", () => {
        const condition = and(eq("$.status", "active"));

        expect(condition).toEqual({
          type: ConditionType.AND,
          conditions: [
            {
              type: ConditionType.EQUALS,
              path: "$.status",
              value: "active",
            },
          ],
        });
      });

      it("should create nested AND condition", () => {
        const condition = and(eq("$.type", "user"), or(eq("$.role", "admin"), eq("$.role", "moderator")));

        expect(condition).toEqual({
          type: ConditionType.AND,
          conditions: [
            {
              type: ConditionType.EQUALS,
              path: "$.type",
              value: "user",
            },
            {
              type: ConditionType.OR,
              conditions: [
                {
                  type: ConditionType.EQUALS,
                  path: "$.role",
                  value: "admin",
                },
                {
                  type: ConditionType.EQUALS,
                  path: "$.role",
                  value: "moderator",
                },
              ],
            },
          ],
        });
      });
    });

    describe("or", () => {
      it("should create OR condition with multiple conditions", () => {
        const condition = or(eq("$.status", "premium"), gt("$.score", 1000));

        expect(condition).toEqual({
          type: ConditionType.OR,
          conditions: [
            {
              type: ConditionType.EQUALS,
              path: "$.status",
              value: "premium",
            },
            {
              type: ConditionType.GREATHER_THAN,
              path: "$.score",
              value: 1000,
            },
          ],
        });
      });

      it("should create OR condition with different comparison types", () => {
        const condition = or(eq("$.type", "guest"), gte("$.age", 65), lt("$.loginCount", 3));

        expect(condition).toEqual({
          type: ConditionType.OR,
          conditions: [
            {
              type: ConditionType.EQUALS,
              path: "$.type",
              value: "guest",
            },
            {
              type: ConditionType.GREATHER_THAN_OR_EQUAL,
              path: "$.age",
              value: 65,
            },
            {
              type: ConditionType.LOWER_THAN,
              path: "$.loginCount",
              value: 3,
            },
          ],
        });
      });
    });
  });

  describe("comparison conditions", () => {
    describe("eq (equals)", () => {
      it("should create equals condition with string value", () => {
        const condition = eq("$.name", "Alice");

        expect(condition).toEqual({
          type: ConditionType.EQUALS,
          path: "$.name",
          value: "Alice",
        });
      });

      it("should create equals condition with number value", () => {
        const condition = eq("$.count", 42);

        expect(condition).toEqual({
          type: ConditionType.EQUALS,
          path: "$.count",
          value: 42,
        });
      });

      it("should create equals condition with boolean value", () => {
        const condition = eq("$.isActive", true);

        expect(condition).toEqual({
          type: ConditionType.EQUALS,
          path: "$.isActive",
          value: true,
        });
      });

      it("should create equals condition with reference value", () => {
        const condition = eq("$.confirmPassword", ref("password"));

        expect(condition).toEqual({
          type: ConditionType.EQUALS,
          path: "$.confirmPassword",
          value: {
            _type: "__dref",
            path: "password",
          },
        });
      });
    });

    describe("neq (not equals)", () => {
      it("should create not equals condition", () => {
        const condition = neq("$.status", "deleted");

        expect(condition).toEqual({
          type: ConditionType.NOT_EQUALS,
          path: "$.status",
          value: "deleted",
        });
      });

      it("should create not equals condition with reference", () => {
        const condition = neq("$.newPassword", ref("currentPassword"));

        expect(condition).toEqual({
          type: ConditionType.NOT_EQUALS,
          path: "$.newPassword",
          value: {
            _type: REFERENCE_TYPE,
            path: "currentPassword",
          },
        });
      });
    });

    describe("gt (greater than)", () => {
      it("should create greater than condition with number", () => {
        const condition = gt("$.age", 18);

        expect(condition).toEqual({
          type: ConditionType.GREATHER_THAN,
          path: "$.age",
          value: 18,
        });
      });

      it("should create greater than condition with string", () => {
        const condition = gt("$.version", "1.0.0");

        expect(condition).toEqual({
          type: ConditionType.GREATHER_THAN,
          path: "$.version",
          value: "1.0.0",
        });
      });

      it("should create greater than condition with reference", () => {
        const condition = gt("$.endDate", ref("startDate"));

        expect(condition).toEqual({
          type: ConditionType.GREATHER_THAN,
          path: "$.endDate",
          value: {
            _type: REFERENCE_TYPE,
            path: "startDate",
          },
        });
      });
    });

    describe("gte (greater than or equal)", () => {
      it("should create greater than or equal condition", () => {
        const condition = gte("$.score", 100);

        expect(condition).toEqual({
          type: ConditionType.GREATHER_THAN_OR_EQUAL,
          path: "$.score",
          value: 100,
        });
      });

      it("should create greater than or equal condition with reference", () => {
        const condition = gte("$.maxValue", ref("minValue"));

        expect(condition).toEqual({
          type: ConditionType.GREATHER_THAN_OR_EQUAL,
          path: "$.maxValue",
          value: {
            _type: REFERENCE_TYPE,
            path: "minValue",
          },
        });
      });
    });

    describe("lt (lower than)", () => {
      it("should create lower than condition", () => {
        const condition = lt("$.attempts", 3);

        expect(condition).toEqual({
          type: ConditionType.LOWER_THAN,
          path: "$.attempts",
          value: 3,
        });
      });

      it("should create lower than condition with reference", () => {
        const condition = lt("$.current", ref("maximum"));

        expect(condition).toEqual({
          type: ConditionType.LOWER_THAN,
          path: "$.current",
          value: {
            _type: REFERENCE_TYPE,
            path: "maximum",
          },
        });
      });
    });

    describe("lte (lower than or equal)", () => {
      it("should create lower than or equal condition", () => {
        const condition = lte("$.discount", 50);

        expect(condition).toEqual({
          type: ConditionType.LOWER_THAN_OR_EQUAL,
          path: "$.discount",
          value: 50,
        });
      });

      it("should create lower than or equal condition with reference", () => {
        const condition = lte("$.quantity", ref("stock"));

        expect(condition).toEqual({
          type: ConditionType.LOWER_THAN_OR_EQUAL,
          path: "$.quantity",
          value: {
            _type: REFERENCE_TYPE,
            path: "stock",
          },
        });
      });
    });
  });

  describe("pattern matching conditions", () => {
    describe("matches", () => {
      it("should create regex matches condition", () => {
        const condition = matches("$.email", "^[^@]+@[^@]+\\.[^@]+$");

        expect(condition).toEqual({
          type: ConditionType.MATCHES,
          path: "$.email",
          value: "^[^@]+@[^@]+\\.[^@]+$",
        });
      });

      it("should create regex matches condition for phone number", () => {
        const condition = matches("$.phone", "^\\+?[1-9]\\d{1,14}$");

        expect(condition).toEqual({
          type: ConditionType.MATCHES,
          path: "$.phone",
          value: "^\\+?[1-9]\\d{1,14}$",
        });
      });

      it("should create regex matches condition for alphanumeric", () => {
        const condition = matches("$.username", "^[a-zA-Z0-9_]+$");

        expect(condition).toEqual({
          type: ConditionType.MATCHES,
          path: "$.username",
          value: "^[a-zA-Z0-9_]+$",
        });
      });
    });
  });

  describe("membership conditions", () => {
    describe("isIn", () => {
      it("should create is in condition with string array", () => {
        const condition = isIn("$.role", ["admin", "moderator", "user"]);

        expect(condition).toEqual({
          type: ConditionType.IS_IN,
          path: "$.role",
          value: ["admin", "moderator", "user"],
        });
      });

      it("should create is in condition with number array", () => {
        const condition = isIn("$.level", [1, 2, 3, 5, 8]);

        expect(condition).toEqual({
          type: ConditionType.IS_IN,
          path: "$.level",
          value: [1, 2, 3, 5, 8],
        });
      });

      it("should create is in condition with mixed value array", () => {
        const condition = isIn("$.status", ["active", "inactive", true, false]);

        expect(condition).toEqual({
          type: ConditionType.IS_IN,
          path: "$.status",
          value: ["active", "inactive", true, false],
        });
      });

      it("should create is in condition with reference values", () => {
        const condition = isIn("$.category", [ref("allowedCategories[0]"), ref("allowedCategories[1]")]);

        expect(condition).toEqual({
          type: ConditionType.IS_IN,
          path: "$.category",
          value: [
            {
              _type: REFERENCE_TYPE,
              path: "allowedCategories[0]",
            },
            {
              _type: REFERENCE_TYPE,
              path: "allowedCategories[1]",
            },
          ],
        });
      });
    });

    describe("isNotIn", () => {
      it("should create is not in condition", () => {
        const condition = isNotIn("$.status", ["banned", "suspended"]);

        expect(condition).toEqual({
          type: ConditionType.IS_NOT_IN,
          path: "$.status",
          value: ["banned", "suspended"],
        });
      });

      it("should create is not in condition with numbers", () => {
        const condition = isNotIn("$.errorCode", [404, 500, 503]);

        expect(condition).toEqual({
          type: ConditionType.IS_NOT_IN,
          path: "$.errorCode",
          value: [404, 500, 503],
        });
      });

      it("should create is not in condition with references", () => {
        const condition = isNotIn("$.userId", [ref("blockedUsers[0]"), ref("blockedUsers[1]")]);

        expect(condition).toEqual({
          type: ConditionType.IS_NOT_IN,
          path: "$.userId",
          value: [
            {
              _type: REFERENCE_TYPE,
              path: "blockedUsers[0]",
            },
            {
              _type: REFERENCE_TYPE,
              path: "blockedUsers[1]",
            },
          ],
        });
      });
    });
  });

  describe("complex condition compositions", () => {
    it("should create complex nested conditions", () => {
      const condition = and(
        eq("$.type", "user"),
        or(and(eq("$.plan", "premium"), gte("$.usage", 1000)), and(eq("$.plan", "free"), lte("$.usage", 100))),
        matches("$.email", "^[^@]+@company\\.com$")
      );

      expect(condition.type).toBe(ConditionType.AND);
      expect(condition.conditions).toHaveLength(3);
      expect(condition.conditions[0].type).toBe(ConditionType.EQUALS);
      expect(condition.conditions[1].type).toBe(ConditionType.OR);
      expect(condition.conditions[2].type).toBe(ConditionType.MATCHES);
    });

    it("should create condition with cross-field references", () => {
      const condition = and(
        neq("$.newPassword", ref("currentPassword")),
        eq("$.confirmPassword", ref("newPassword")),
        gte("$.passwordStrength", 8)
      );

      expect(condition).toEqual({
        type: ConditionType.AND,
        conditions: [
          {
            type: ConditionType.NOT_EQUALS,
            path: "$.newPassword",
            value: { _type: REFERENCE_TYPE, path: "currentPassword" },
          },
          {
            type: ConditionType.EQUALS,
            path: "$.confirmPassword",
            value: { _type: REFERENCE_TYPE, path: "newPassword" },
          },
          {
            type: ConditionType.GREATHER_THAN_OR_EQUAL,
            path: "$.passwordStrength",
            value: 8,
          },
        ],
      });
    });

    it("should create condition for form validation scenario", () => {
      const condition = or(
        and(
          eq("$.accountType", "business"),
          matches("$.businessId", "^[A-Z]{2}\\d{8}$"),
          isIn("$.industry", ["tech", "finance", "healthcare"])
        ),
        and(eq("$.accountType", "personal"), gte("$.age", 18), isNotIn("$.country", ["restricted1", "restricted2"]))
      );

      expect(condition.type).toBe(ConditionType.OR);
      expect(condition.conditions).toHaveLength(2);

      const businessCondition = condition.conditions[0];
      expect(businessCondition.type).toBe(ConditionType.AND);
      expect(businessCondition.conditions).toHaveLength(3);

      const personalCondition = condition.conditions[1];
      expect(personalCondition.type).toBe(ConditionType.AND);
      expect(personalCondition.conditions).toHaveLength(3);
    });
  });

  describe("path handling", () => {
    it("should handle absolute paths", () => {
      const condition = eq("$.user.profile.name", "John");

      expect(condition).toEqual({
        type: ConditionType.EQUALS,
        path: "$.user.profile.name",
        value: "John",
      });
    });

    it("should handle array index paths", () => {
      const condition = gt("$.scores[0]", ref("$.scores[1]"));

      expect(condition).toEqual({
        type: ConditionType.GREATHER_THAN,
        path: "$.scores[0]",
        value: {
          _type: REFERENCE_TYPE,
          path: "$.scores[1]",
        },
      });
    });

    it("should handle nested object paths", () => {
      const condition = matches("$.user.contacts[0].email", "^[^@]+@[^@]+$");

      expect(condition).toEqual({
        type: ConditionType.MATCHES,
        path: "$.user.contacts[0].email",
        value: "^[^@]+@[^@]+$",
      });
    });
  });
});
