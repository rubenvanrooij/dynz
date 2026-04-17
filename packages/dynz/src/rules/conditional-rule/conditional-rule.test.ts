import { describe, expect, it } from "vitest";
import { and, eq, or, v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { buildCustomRule, buildMaxRule, buildMinRule, buildRegexRule } from "..";
import { buildEqualsRule } from "../equals-rule";
import { buildConditionalRule } from "./index";

describe("conditional rule", () => {
  it("should create conditional rule with simple condition", () => {
    const when = eq(v("$.type"), v("premium"));
    const then = buildMinRule(v(10));
    const rule = buildConditionalRule({ when, then });

    expect(rule).toEqual({
      type: "conditional",
      cases: [{ when, then }],
    });
  });

  it("should create conditional rule with complex condition", () => {
    const when = and(eq(v("$.accountType"), v("business")), eq(v("$.plan"), v("enterprise")));
    const then = buildMaxRule(v(1000));
    const rule = buildConditionalRule({ when, then });

    expect(rule).toEqual({
      type: "conditional",
      cases: [{ when, then }],
    });
    expect(rule.cases[0].when.type).toBe("and");
    expect(rule.cases[0].when.predicates).toHaveLength(2);
  });

  it("should create conditional rule with OR condition", () => {
    const rule = buildConditionalRule({
      when: or(eq(v("$.role"), v("admin")), eq(v("$.role"), v("moderator"))),
      then: buildRegexRule("^[a-zA-Z0-9_-]+$"),
    });

    expect(rule.cases[0].when.type).toBe("or");
    expect(rule.cases[0].then.type).toBe("regex");
  });

  it("should create conditional rule with custom rule", () => {
    const rule = buildConditionalRule({
      when: eq(v("$.requiresValidation"), v(true)),
      then: buildCustomRule("complexBusinessValidation", {
        level: v("strict"),
        timeout: v(5000),
      }),
    });

    expect(rule).toEqual({
      type: "conditional",
      cases: [
        {
          when: eq(v("$.requiresValidation"), v(true)),
          then: {
            type: "custom",
            name: "complexBusinessValidation",
            params: {
              level: v("strict"),
              timeout: v(5000),
            },
          },
        },
      ],
    });
  });

  it("should create nested conditional rules scenario", () => {
    const rule = buildConditionalRule({
      when: and(eq(v("$.userType"), v("premium")), or(eq(v("$.region"), v("US")), eq(v("$.region"), v("EU")))),
      then: buildEqualsRule(ref("$.settings.premiumValue")),
    });

    expect(rule.cases[0].when.type).toBe("and");
    expect(rule.cases[0].when.predicates).toHaveLength(2);
    expect(rule.cases[0].when.predicates[1].type).toBe("or");
    expect(rule.cases[0].then.type).toBe("equals");
    expect(rule.cases[0].then.equals.type).toBe(REFERENCE_TYPE);
  });
});
