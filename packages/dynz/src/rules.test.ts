import { describe, expect, it } from "vitest";
import { and, eq, or } from "./conditions";
import { after, before, conditional, custom, equals, isNumeric, max, min, ref, regex, rules } from "./rules";
import { ConditionType, REFERENCE_TYPE, RuleType } from "./types";

describe("rules", () => {
  describe("rules function", () => {
    it("should return array of rules when given multiple rules", () => {
      const result = rules(min(5), max(10), regex("^[a-z]+$"));

      expect(result).toEqual([
        { type: RuleType.MIN, min: 5 },
        { type: RuleType.MAX, max: 10 },
        { type: RuleType.REGEX, regex: "^[a-z]+$" },
      ]);
    });

    it("should return array with single rule", () => {
      const result = rules(equals("test"));

      expect(result).toEqual([{ type: RuleType.EQUALS, value: "test" }]);
    });

    it("should return empty array when no rules provided", () => {
      const result = rules();

      expect(result).toEqual([]);
    });

    it("should preserve rule order", () => {
      const result = rules(max(100), min(1), equals(50));

      expect(result[0]).toEqual({ type: RuleType.MAX, max: 100 });
      expect(result[1]).toEqual({ type: RuleType.MIN, min: 1 });
      expect(result[2]).toEqual({ type: RuleType.EQUALS, value: 50 });
    });
  });

  describe("ref function", () => {
    it("should create reference with simple path", () => {
      const reference = ref("name");

      expect(reference).toEqual({
        _type: REFERENCE_TYPE,
        path: "name",
      });
    });

    it("should create reference with absolute path", () => {
      const reference = ref("$.user.email");

      expect(reference).toEqual({
        _type: REFERENCE_TYPE,
        path: "$.user.email",
      });
    });

    it("should create reference with array index path", () => {
      const reference = ref("items[0].id");

      expect(reference).toEqual({
        _type: REFERENCE_TYPE,
        path: "items[0].id",
      });
    });

    it("should create reference with nested object path", () => {
      const reference = ref("user.profile.settings.theme");

      expect(reference).toEqual({
        _type: REFERENCE_TYPE,
        path: "user.profile.settings.theme",
      });
    });

    it("should preserve exact path string", () => {
      const complexPath = "$.data.users[5].contacts[0].address.street";
      const reference = ref(complexPath);

      expect(reference.path).toBe(complexPath);
    });
  });

  describe("min rule", () => {
    it("should create min rule with number value", () => {
      const rule = min(5);

      expect(rule).toEqual({
        type: RuleType.MIN,
        min: 5,
      });
    });

    it("should create min rule with decimal number", () => {
      const rule = min(3.14);

      expect(rule).toEqual({
        type: RuleType.MIN,
        min: 3.14,
      });
    });

    it("should create min rule with zero", () => {
      const rule = min(0);

      expect(rule).toEqual({
        type: RuleType.MIN,
        min: 0,
      });
    });

    it("should create min rule with negative number", () => {
      const rule = min(-10);

      expect(rule).toEqual({
        type: RuleType.MIN,
        min: -10,
      });
    });

    it("should create min rule with date string", () => {
      const rule = min("2024-01-01");

      expect(rule).toEqual({
        type: RuleType.MIN,
        min: "2024-01-01",
      });
    });

    it("should create min rule with reference", () => {
      const reference = ref("minimumValue");
      const rule = min(reference);

      expect(rule).toEqual({
        type: RuleType.MIN,
        min: {
          _type: REFERENCE_TYPE,
          path: "minimumValue",
        },
      });
    });

    it("should create min rule with cross-field reference", () => {
      const rule = min(ref("$.startDate"));

      expect(rule).toEqual({
        type: RuleType.MIN,
        min: {
          _type: REFERENCE_TYPE,
          path: "$.startDate",
        },
      });
    });
  });

  describe("max rule", () => {
    it("should create max rule with number value", () => {
      const rule = max(100);

      expect(rule).toEqual({
        type: RuleType.MAX,
        max: 100,
      });
    });

    it("should create max rule with decimal number", () => {
      const rule = max(99.99);

      expect(rule).toEqual({
        type: RuleType.MAX,
        max: 99.99,
      });
    });

    it("should create max rule with date string", () => {
      const rule = max("2024-12-31");

      expect(rule).toEqual({
        type: RuleType.MAX,
        max: "2024-12-31",
      });
    });

    it("should create max rule with reference", () => {
      const reference = ref("maximumAllowed");
      const rule = max(reference);

      expect(rule).toEqual({
        type: RuleType.MAX,
        max: {
          _type: REFERENCE_TYPE,
          path: "maximumAllowed",
        },
      });
    });

    it("should create max rule with array reference", () => {
      const rule = max(ref("limits[0]"));

      expect(rule).toEqual({
        type: RuleType.MAX,
        max: {
          _type: REFERENCE_TYPE,
          path: "limits[0]",
        },
      });
    });
  });

  describe("regex rule", () => {
    it("should create regex rule for email validation", () => {
      const rule = regex("^[^@]+@[^@]+\\.[^@]+$");

      expect(rule).toEqual({
        type: RuleType.REGEX,
        regex: "^[^@]+@[^@]+\\.[^@]+$",
      });
    });

    it("should create regex rule for phone number validation", () => {
      const rule = regex("^\\+?[1-9]\\d{1,14}$");

      expect(rule).toEqual({
        type: RuleType.REGEX,
        regex: "^\\+?[1-9]\\d{1,14}$",
      });
    });

    it("should create regex rule for alphanumeric validation", () => {
      const rule = regex("^[a-zA-Z0-9]+$");

      expect(rule).toEqual({
        type: RuleType.REGEX,
        regex: "^[a-zA-Z0-9]+$",
      });
    });

    it("should create regex rule for URL validation", () => {
      const urlPattern =
        "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$";
      const rule = regex(urlPattern);

      expect(rule).toEqual({
        type: RuleType.REGEX,
        regex: urlPattern,
      });
    });

    it("should create regex rule for password strength", () => {
      const passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
      const rule = regex(passwordPattern);

      expect(rule).toEqual({
        type: RuleType.REGEX,
        regex: passwordPattern,
      });
    });

    it("should handle simple patterns", () => {
      const rule = regex("[0-9]+");

      expect(rule).toEqual({
        type: RuleType.REGEX,
        regex: "[0-9]+",
      });
    });
  });

  describe("equals rule", () => {
    it("should create equals rule with string value", () => {
      const rule = equals("admin");

      expect(rule).toEqual({
        type: RuleType.EQUALS,
        value: "admin",
      });
    });

    it("should create equals rule with number value", () => {
      const rule = equals(42);

      expect(rule).toEqual({
        type: RuleType.EQUALS,
        value: 42,
      });
    });

    it("should create equals rule with boolean value", () => {
      const rule = equals(true);

      expect(rule).toEqual({
        type: RuleType.EQUALS,
        value: true,
      });
    });

    it("should create equals rule with reference", () => {
      const reference = ref("confirmPassword");
      const rule = equals(reference);

      expect(rule).toEqual({
        type: RuleType.EQUALS,
        value: {
          _type: REFERENCE_TYPE,
          path: "confirmPassword",
        },
      });
    });

    it("should create equals rule with cross-field reference", () => {
      const rule = equals(ref("$.user.expectedRole"));

      expect(rule).toEqual({
        type: RuleType.EQUALS,
        value: {
          _type: REFERENCE_TYPE,
          path: "$.user.expectedRole",
        },
      });
    });

    it("should create equals rule with array value", () => {
      const rule = equals(["admin", "user"]);

      expect(rule).toEqual({
        type: RuleType.EQUALS,
        value: ["admin", "user"],
      });
    });
  });

  describe("isNumeric rule", () => {
    it("should create isNumeric rule", () => {
      const rule = isNumeric();

      expect(rule).toEqual({
        type: RuleType.IS_NUMERIC,
      });
    });

    it("should create isNumeric rule without parameters", () => {
      const rule = isNumeric();

      expect(rule.type).toBe(RuleType.IS_NUMERIC);
      expect(Object.keys(rule)).toHaveLength(2);
    });
  });

  describe("custom rule", () => {
    it("should create custom rule with name only", () => {
      const rule = custom("validateUniqueEmail");

      expect(rule).toEqual({
        type: RuleType.CUSTOM,
        name: "validateUniqueEmail",
        params: {},
      });
    });

    it("should create custom rule with name and params", () => {
      const rule = custom("validateLength", {
        min: 5,
        max: 50,
      });

      expect(rule).toEqual({
        type: RuleType.CUSTOM,
        name: "validateLength",
        params: {
          min: 5,
          max: 50,
        },
      });
    });

    it("should create custom rule with reference parameters", () => {
      const rule = custom("validateGreaterThan", {
        threshold: ref("minimumValue"),
        strict: true,
      });

      expect(rule).toEqual({
        type: RuleType.CUSTOM,
        name: "validateGreaterThan",
        params: {
          threshold: {
            _type: REFERENCE_TYPE,
            path: "minimumValue",
          },
          strict: true,
        },
      });
    });

    it("should create custom rule with complex parameters", () => {
      const rule = custom("validateBusinessRules", {
        category: "finance",
        limits: {
          daily: ref("$.settings.dailyLimit"),
          monthly: ref("$.settings.monthlyLimit"),
        },
        allowOverride: false,
        notificationEmail: "admin@company.com",
      });

      expect(rule.name).toBe("validateBusinessRules");
      expect(rule.params.category).toBe("finance");
      expect(rule.params.limits.daily).toEqual({
        _type: REFERENCE_TYPE,
        path: "$.settings.dailyLimit",
      });
      expect(rule.params.allowOverride).toBe(false);
    });

    it("should handle empty params object", () => {
      const rule = custom("simpleValidation", {});

      expect(rule).toEqual({
        type: RuleType.CUSTOM,
        name: "simpleValidation",
        params: {},
      });
    });
  });

  describe("conditional rule", () => {
    it("should create conditional rule with simple condition", () => {
      const rule = conditional({
        when: eq("$.type", "premium"),
        then: min(10),
      });

      expect(rule).toEqual({
        type: RuleType.CONDITIONAL,
        when: {
          type: ConditionType.EQUALS,
          path: "$.type",
          value: "premium",
        },
        then: {
          type: RuleType.MIN,
          min: 10,
        },
      });
    });

    it("should create conditional rule with complex condition", () => {
      const rule = conditional({
        when: and(eq("$.accountType", "business"), eq("$.plan", "enterprise")),
        then: max(1000),
      });

      expect(rule).toEqual({
        type: RuleType.CONDITIONAL,
        when: {
          type: ConditionType.AND,
          conditions: [
            {
              type: ConditionType.EQUALS,
              path: "$.accountType",
              value: "business",
            },
            {
              type: ConditionType.EQUALS,
              path: "$.plan",
              value: "enterprise",
            },
          ],
        },
        then: {
          type: RuleType.MAX,
          max: 1000,
        },
      });
    });

    it("should create conditional rule with OR condition", () => {
      const rule = conditional({
        when: or(eq("$.role", "admin"), eq("$.role", "moderator")),
        then: regex("^[a-zA-Z0-9_-]+$"),
      });

      expect(rule.when.type).toBe(ConditionType.OR);
      expect(rule.then.type).toBe(RuleType.REGEX);
    });

    it("should create conditional rule with custom rule", () => {
      const rule = conditional({
        when: eq("$.requiresValidation", true),
        then: custom("complexBusinessValidation", {
          level: "strict",
          timeout: 5000,
        }),
      });

      expect(rule).toEqual({
        type: RuleType.CONDITIONAL,
        when: {
          type: ConditionType.EQUALS,
          path: "$.requiresValidation",
          value: true,
        },
        then: {
          type: RuleType.CUSTOM,
          name: "complexBusinessValidation",
          params: {
            level: "strict",
            timeout: 5000,
          },
        },
      });
    });

    it("should create nested conditional rules scenario", () => {
      const rule = conditional({
        when: and(eq("$.userType", "premium"), or(eq("$.region", "US"), eq("$.region", "EU"))),
        then: equals(ref("$.settings.premiumValue")),
      });

      expect(rule.when.type).toBe(ConditionType.AND);
      expect(rule.when.conditions).toHaveLength(2);
      expect(rule.when.conditions[1].type).toBe(ConditionType.OR);
      expect(rule.then.type).toBe(RuleType.EQUALS);
      expect(rule.then.value._type).toBe(REFERENCE_TYPE);
    });
  });

  describe("after rule", () => {
    it("should create after rule with date string", () => {
      const rule = after("2024-01-01");

      expect(rule).toEqual({
        type: RuleType.AFTER,
        after: "2024-01-01",
      });
    });

    it("should create after rule with Date object", () => {
      const dateObj = new Date("2024-01-01");
      const rule = after(dateObj);

      expect(rule).toEqual({
        type: RuleType.AFTER,
        after: dateObj,
      });
    });

    it("should create after rule with reference", () => {
      const reference = ref("$.startDate");
      const rule = after(reference);

      expect(rule).toEqual({
        type: RuleType.AFTER,
        after: {
          _type: REFERENCE_TYPE,
          path: "$.startDate",
        },
      });
    });

    it("should create after rule with custom code", () => {
      const rule = after("2024-06-15", "CUSTOM_AFTER_ERROR");

      expect(rule).toEqual({
        type: RuleType.AFTER,
        after: "2024-06-15",
        code: "CUSTOM_AFTER_ERROR",
      });
    });
  });

  describe("before rule", () => {
    it("should create before rule with date string", () => {
      const rule = before("2024-12-31");

      expect(rule).toEqual({
        type: RuleType.BEFORE,
        before: "2024-12-31",
      });
    });

    it("should create before rule with Date object", () => {
      const dateObj = new Date("2024-12-31");
      const rule = before(dateObj);

      expect(rule).toEqual({
        type: RuleType.BEFORE,
        before: dateObj,
      });
    });

    it("should create before rule with reference", () => {
      const reference = ref("$.endDate");
      const rule = before(reference);

      expect(rule).toEqual({
        type: RuleType.BEFORE,
        before: {
          _type: REFERENCE_TYPE,
          path: "$.endDate",
        },
      });
    });

    it("should create before rule with custom code", () => {
      const rule = before("2024-01-01", "CUSTOM_BEFORE_ERROR");

      expect(rule).toEqual({
        type: RuleType.BEFORE,
        before: "2024-01-01",
        code: "CUSTOM_BEFORE_ERROR",
      });
    });
  });

  describe("rule combinations", () => {
    it("should create complex rule set for password validation", () => {
      const passwordRules = rules(
        min(8),
        max(128),
        regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$"),
        conditional({
          when: eq("$.securityLevel", "high"),
          then: min(12),
        })
      );

      expect(passwordRules).toHaveLength(4);
      expect(passwordRules[0].type).toBe(RuleType.MIN);
      expect(passwordRules[1].type).toBe(RuleType.MAX);
      expect(passwordRules[2].type).toBe(RuleType.REGEX);
      expect(passwordRules[3].type).toBe(RuleType.CONDITIONAL);
    });

    it("should create email validation rule set", () => {
      const emailRules = rules(
        regex("^[^@]+@[^@]+\\.[^@]+$"),
        max(320), // RFC 5321 limit
        custom("validateEmailDomain", {
          allowedDomains: ["company.com", "partner.org"],
          blockDisposable: true,
        })
      );

      expect(emailRules).toHaveLength(3);
      expect(emailRules[0].type).toBe(RuleType.REGEX);
      expect(emailRules[1].type).toBe(RuleType.MAX);
      expect(emailRules[2].type).toBe(RuleType.CUSTOM);
      expect(emailRules[2].name).toBe("validateEmailDomain");
    });

    it("should create age validation with cross-references", () => {
      const ageRules = rules(
        min(ref("$.legalMinimumAge")),
        max(ref("$.retirementAge")),
        conditional({
          when: eq("$.requiresParentalConsent", true),
          then: custom("validateParentalConsent", {
            guardianEmail: ref("$.guardian.email"),
          }),
        })
      );

      expect(ageRules).toHaveLength(3);
      expect(ageRules[0].min._type).toBe(REFERENCE_TYPE);
      expect(ageRules[1].max._type).toBe(REFERENCE_TYPE);
      expect(ageRules[2].type).toBe(RuleType.CONDITIONAL);
    });

    it("should create date range validation", () => {
      const dateRules = rules(
        min(ref("$.startDate")),
        max("2030-12-31"),
        conditional({
          when: eq("$.isRecurring", true),
          then: custom("validateRecurrencePattern", {
            maxOccurrences: ref("$.maxRecurrences"),
            endDate: ref("$.seriesEndDate"),
          }),
        })
      );

      expect(dateRules).toHaveLength(3);
      expect(dateRules[0].min.path).toBe("$.startDate");
      expect(dateRules[1].max).toBe("2030-12-31");
      expect(dateRules[2].then.params.maxOccurrences._type).toBe(REFERENCE_TYPE);
    });
  });
});
