import { describe, expect, it } from "vitest";
import { and, eq, or, v } from "../../functions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { custom, max, min, regex } from "..";
import { equals } from "../equals-rule";
import { conditional } from "./index";

describe("conditional rule", () => {
  it("should create conditional rule with simple condition", () => {
    const when = eq(v("$.type"), v("premium"));
    const then = min(v(10));
    const rule = conditional({ when, then });

    expect(rule).toEqual({
      type: "conditional",
      cases: [{ when, then }],
    });
  });

  it("should create conditional rule with complex condition", () => {
    const when = and(eq(v("$.accountType"), v("business")), eq(v("$.plan"), v("enterprise")));
    const then = max(v(1000));
    const rule = conditional({ when, then });

    expect(rule).toEqual({
      type: "conditional",
      cases: [{ when, then }],
    });
    expect(rule.cases[0].when.type).toBe("and");
    expect(rule.cases[0].when.predicates).toHaveLength(2);
  });

  it("should create conditional rule with OR condition", () => {
    const rule = conditional({
      when: or(eq(v("$.role"), v("admin")), eq(v("$.role"), v("moderator"))),
      then: regex("^[a-zA-Z0-9_-]+$"),
    });

    expect(rule.cases[0].when.type).toBe("or");
    expect(rule.cases[0].then.type).toBe("regex");
  });

  it("should create conditional rule with custom rule", () => {
    const rule = conditional({
      when: eq(v("$.requiresValidation"), v(true)),
      then: custom("complexBusinessValidation", {
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
});
