import { describe, expect, it } from "vitest";
import { and, ConditionType, eq, or, REFERENCE_TYPE, ref } from "./conditions";
import {
  after,
  before,
  conditional,
  custom,
  equals,
  isNumeric,
  max,
  maxDate,
  min,
  minDate,
  regex,
} from "./shared-rules";

describe("rules", () => {
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
        type: "min",
        min: 5,
      });
    });

    it("should create min rule with decimal number", () => {
      const rule = min(3.14);

      expect(rule).toEqual({
        type: "min",
        min: 3.14,
      });
    });

    it("should create min rule with zero", () => {
      const rule = min(0);

      expect(rule).toEqual({
        type: "min",
        min: 0,
      });
    });

    it("should create min rule with negative number", () => {
      const rule = min(-10);

      expect(rule).toEqual({
        type: "min",
        min: -10,
      });
    });

    it.skip("should create min rule with date string", () => {
      // const rule = minDate("2024-01-01");
      // expect(rule).toEqual({
      //   type: 'min'_DATE,
      //   min: "2024-01-01",
      // });
    });

    it("should create min rule with reference", () => {
      const reference = ref("minimumValue");
      const rule = min(reference);

      expect(rule).toEqual({
        type: "min",
        min: {
          _type: REFERENCE_TYPE,
          path: "minimumValue",
        },
      });
    });

    it("should create min rule with cross-field reference", () => {
      const rule = min(ref("$.startDate"));

      expect(rule).toEqual({
        type: "min",
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
        type: "max",
        max: 100,
      });
    });

    it("should create max rule with decimal number", () => {
      const rule = max(99.99);

      expect(rule).toEqual({
        type: "max",
        max: 99.99,
      });
    });

    it("should create max rule with reference", () => {
      const reference = ref("maximumAllowed");
      const rule = max(reference);

      expect(rule).toEqual({
        type: "max",
        max: {
          _type: REFERENCE_TYPE,
          path: "maximumAllowed",
        },
      });
    });

    it("should create max rule with array reference", () => {
      const rule = max(ref("limits[0]"));

      expect(rule).toEqual({
        type: "max",
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
        type: "regex",
        regex: "^[^@]+@[^@]+\\.[^@]+$",
      });
    });

    it("should create regex rule for phone number validation", () => {
      const rule = regex("^\\+?[1-9]\\d{1,14}$");

      expect(rule).toEqual({
        type: "regex",
        regex: "^\\+?[1-9]\\d{1,14}$",
      });
    });

    it("should create regex rule for alphanumeric validation", () => {
      const rule = regex("^[a-zA-Z0-9]+$");

      expect(rule).toEqual({
        type: "regex",
        regex: "^[a-zA-Z0-9]+$",
      });
    });

    it("should create regex rule for URL validation", () => {
      const urlPattern =
        "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$";
      const rule = regex(urlPattern);

      expect(rule).toEqual({
        type: "regex",
        regex: urlPattern,
      });
    });

    it("should create regex rule for password strength", () => {
      const passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
      const rule = regex(passwordPattern);

      expect(rule).toEqual({
        type: "regex",
        regex: passwordPattern,
      });
    });

    it("should handle simple patterns", () => {
      const rule = regex("[0-9]+");

      expect(rule).toEqual({
        type: "regex",
        regex: "[0-9]+",
      });
    });
  });

  describe("equals rule", () => {
    it("should create equals rule with string value", () => {
      const rule = equals("admin");

      expect(rule).toEqual({
        type: "equals",
        equals: "admin",
      });
    });

    it("should create equals rule with number value", () => {
      const rule = equals(42);

      expect(rule).toEqual({
        type: "equals",
        equals: 42,
      });
    });

    it("should create equals rule with boolean value", () => {
      const rule = equals(true);

      expect(rule).toEqual({
        type: "equals",
        equals: true,
      });
    });

    it("should create equals rule with reference", () => {
      const reference = ref("confirmPassword");
      const rule = equals(reference);

      expect(rule).toEqual({
        type: "equals",
        equals: {
          _type: REFERENCE_TYPE,
          path: "confirmPassword",
        },
      });
    });

    it("should create equals rule with cross-field reference", () => {
      const rule = equals(ref("$.user.expectedRole"));

      expect(rule).toEqual({
        type: "equals",
        equals: {
          _type: REFERENCE_TYPE,
          path: "$.user.expectedRole",
        },
      });
    });

    it("should create equals rule with array value", () => {
      const rule = equals(["admin", "user"]);

      expect(rule).toEqual({
        type: "equals",
        equals: ["admin", "user"],
      });
    });
  });

  describe("isNumeric rule", () => {
    it("should create isNumeric rule", () => {
      const rule = isNumeric();

      expect(rule).toEqual({
        type: "is_numeric",
      });
    });

    it("should create isNumeric rule without parameters", () => {
      const rule = isNumeric();

      expect(rule.type).toBe("is_numeric");
      expect(Object.keys(rule)).toHaveLength(2);
    });
  });

  describe("custom rule", () => {
    it("should create custom rule with name only", () => {
      const rule = custom("validateUniqueEmail");

      expect(rule).toEqual({
        type: "custom",
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
        type: "custom",
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
        type: "custom",
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
        type: "custom",
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
        type: "conditional",
        when: {
          type: ConditionType.EQUALS,
          path: "$.type",
          value: "premium",
        },
        then: {
          type: "min",
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
        type: "conditional",
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
          type: "max",
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
      expect(rule.then.type).toBe("regex");
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
        type: "conditional",
        when: {
          type: ConditionType.EQUALS,
          path: "$.requiresValidation",
          value: true,
        },
        then: {
          type: "custom",
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
      expect(rule.then.type).toBe("equals");
      expect(rule.then.equals._type).toBe(REFERENCE_TYPE);
    });
  });

  describe("after rule", () => {
    it("should create after rule with Date object", () => {
      const dateObj = new Date("2024-01-01");
      const rule = after(dateObj);

      expect(rule).toEqual({
        type: "after",
        after: dateObj,
      });
    });

    it("should create after rule with reference", () => {
      const reference = ref("$.startDate");
      const rule = after(reference);

      expect(rule).toEqual({
        type: "after",
        after: {
          _type: REFERENCE_TYPE,
          path: "$.startDate",
        },
      });
    });

    it("should create after rule with custom code", () => {
      const rule = after(new Date("2024-06-15"), "CUSTOM_AFTER_ERROR");

      expect(rule).toEqual({
        type: "after",
        after: new Date("2024-06-15"),
        code: "CUSTOM_AFTER_ERROR",
      });
    });
  });

  describe("before rule", () => {
    it("should create before rule with Date object", () => {
      const dateObj = new Date("2024-12-31");
      const rule = before(dateObj);

      expect(rule).toEqual({
        type: "before",
        before: dateObj,
      });
    });

    it("should create before rule with reference", () => {
      const reference = ref("$.endDate");
      const rule = before(reference);

      expect(rule).toEqual({
        type: "before",
        before: {
          _type: REFERENCE_TYPE,
          path: "$.endDate",
        },
      });
    });

    it("should create before rule with custom code", () => {
      const rule = before(new Date("2024-01-01"), "CUSTOM_BEFORE_ERROR");

      expect(rule).toEqual({
        type: "before",
        before: new Date("2024-01-01"),
        code: "CUSTOM_BEFORE_ERROR",
      });
    });
  });

  describe("rule combinations", () => {
    it("should create complex rule set for password validation", () => {
      const passwordRules = [
        min(8),
        max(128),
        regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$"),
        conditional({
          when: eq("$.securityLevel", "high"),
          then: min(12),
        }),
      ];

      expect(passwordRules).toHaveLength(4);
      expect(passwordRules[0].type).toBe("min");
      expect(passwordRules[1].type).toBe("max");
      expect(passwordRules[2].type).toBe("regex");
      expect(passwordRules[3].type).toBe("conditional");
    });

    it("should create email validation rule set", () => {
      const emailRules = [
        regex("^[^@]+@[^@]+\\.[^@]+$"),
        max(320), // RFC 5321 limit
        custom("validateEmailDomain", {
          allowedDomains: ["company.com", "partner.org"],
          blockDisposable: true,
        }),
      ] as const;

      expect(emailRules).toHaveLength(3);
      expect(emailRules[0].type).toBe("regex");
      expect(emailRules[1].type).toBe("max");
      expect(emailRules[2].type).toBe("custom");
      expect(emailRules[2].name).toBe("validateEmailDomain");
    });

    it("should create age validation with cross-references", () => {
      const ageRules = [
        min(ref("$.legalMinimumAge")),
        max(ref("$.retirementAge")),
        conditional({
          when: eq("$.requiresParentalConsent", true),
          then: custom("validateParentalConsent", {
            guardianEmail: ref("$.guardian.email"),
          }),
        }),
      ] as const;

      expect(ageRules).toHaveLength(3);
      expect(ageRules[0].min._type).toBe(REFERENCE_TYPE);
      expect(ageRules[1].max._type).toBe(REFERENCE_TYPE);
      expect(ageRules[2].type).toBe("conditional");
    });

    it("should create date range validation", () => {
      const dateRules = [
        minDate(ref("$.startDate")),
        maxDate(new Date("2030-12-31")),
        conditional({
          when: eq("$.isRecurring", true),
          then: custom("validateRecurrencePattern", {
            maxOccurrences: ref("$.maxRecurrences"),
            endDate: ref("$.seriesEndDate"),
          }),
        }),
      ] as const;

      expect(dateRules).toHaveLength(3);
      expect(dateRules[0].min.path).toBe("$.startDate");
      expect(dateRules[1].max).toEqual(new Date("2030-12-31"));
      expect(dateRules[2].then.params.maxOccurrences._type).toBe(REFERENCE_TYPE);
    });
  });
});
