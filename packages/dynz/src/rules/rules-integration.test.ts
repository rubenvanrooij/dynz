import { describe, expect, it } from "vitest";
import { and, eq, or, v } from "../functions";
import { REFERENCE_TYPE, ref } from "../reference/reference";
import { conditional, custom, equals, max, maxDate, min, minDate, regex } from "./index";

describe("rules integration", () => {
  describe("ref function", () => {
    it("should create reference with simple path", () => {
      const reference = ref("name");

      expect(reference).toEqual({
        type: REFERENCE_TYPE,
        path: "name",
      });
    });

    it("should create reference with absolute path", () => {
      const reference = ref("$.user.email");

      expect(reference).toEqual({
        type: REFERENCE_TYPE,
        path: "$.user.email",
      });
    });

    it("should create reference with array index path", () => {
      const reference = ref("items[0].id");

      expect(reference).toEqual({
        type: REFERENCE_TYPE,
        path: "items[0].id",
      });
    });

    it("should create reference with nested object path", () => {
      const reference = ref("user.profile.settings.theme");

      expect(reference).toEqual({
        type: REFERENCE_TYPE,
        path: "user.profile.settings.theme",
      });
    });

    it("should preserve exact path string", () => {
      const complexPath = "$.data.users[5].contacts[0].address.street";
      const reference = ref(complexPath);

      expect(reference.path).toBe(complexPath);
    });
  });

  describe("rule combinations", () => {
    it("should create complex rule set for password validation", () => {
      const passwordRules = [
        min(v(8)),
        max(v(128)),
        regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$"),
        conditional({
          when: eq(ref("$.securityLevel"), v("high")),
          then: min(v(12)),
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
        max(v(320)), // RFC 5321 limit
        custom("validateEmailDomain", {
          allowedDomains: v(["company.com", "partner.org"]),
          blockDisposable: v(true),
        }),
      ] as const;

      expect(emailRules).toHaveLength(3);
      expect(emailRules[0].type).toBe("regex");
      expect(emailRules[1].type).toBe("max");
      expect(emailRules[2].type).toBe("custom");
      expect(emailRules[2].name).toBe("validateEmailDomain");
    });

    it("should create nested conditional rules scenario", () => {
      const rule = conditional({
        when: and(eq(v("$.userType"), v("premium")), or(eq(v("$.region"), v("US")), eq(v("$.region"), v("EU")))),
        then: equals(ref("$.settings.premiumValue")),
      });

      expect(rule.cases[0].when.type).toBe("and");
      expect(rule.cases[0].when.predicates).toHaveLength(2);
      expect(rule.cases[0].when.predicates[1].type).toBe("or");
      expect(rule.cases[0].then.type).toBe("equals");
      expect(rule.cases[0].then.equals.type).toBe(REFERENCE_TYPE);
    });

    it("should create age validation with cross-references", () => {
      const ageRules = [
        min(ref("$.legalMinimumAge")),
        max(ref("$.retirementAge")),
        conditional({
          when: eq(ref("$.requiresParentalConsent"), v(true)),
          then: custom("validateParentalConsent", {
            guardianEmail: ref("$.guardian.email"),
          }),
        }),
      ] as const;

      expect(ageRules).toHaveLength(3);
      expect(ageRules[0].min.type).toBe(REFERENCE_TYPE);
      expect(ageRules[1].max.type).toBe(REFERENCE_TYPE);
      expect(ageRules[2].type).toBe("conditional");
    });

    it("should create date range validation", () => {
      const dateRules = [
        minDate(ref("$.startDate")),
        maxDate(v(new Date("2030-12-31"))),
        conditional({
          when: eq(ref("$.isRecurring"), v(true)),
          then: custom("validateRecurrencePattern", {
            maxOccurrences: ref("$.maxRecurrences"),
            endDate: ref("$.seriesEndDate"),
          }),
        }),
      ] as const;

      expect(dateRules).toHaveLength(3);
      expect(dateRules[0].min.path).toBe("$.startDate");
      expect(dateRules[1].max).toEqual(v(new Date("2030-12-31")));
      expect(dateRules[2].cases[0].then.params.maxOccurrences.type).toBe(REFERENCE_TYPE);
    });
  });
});
