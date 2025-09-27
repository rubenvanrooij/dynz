import { describe, expect, it } from "vitest";
import { and, ConditionType, eq, or } from "../../conditions";
import { REFERENCE_TYPE, ref } from "../../reference";
import { custom, max, min, regex } from "..";
import { equals } from "../equals-rule";
import { conditional } from "./index";

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
