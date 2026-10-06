import { describe, expect, it } from "vitest";
import { gt, v } from "../../functions";
import { ref } from "../../reference";
import { type NumberSchema, number } from "../../schemas";
import type { Context } from "../../types";
import { buildSatisfiesRule, satisfiesRule } from "./index";

describe("satisfies rule", () => {
  it("should create satisfies rule", () => {
    expect(buildSatisfiesRule(gt(ref("a"), v(1)), "CUSTOM")).toEqual({
      type: "satisfies",
      predicate: gt(ref("a"), v(1)),
      code: "CUSTOM",
    });
  });
});

describe("satisfiesRule validator", () => {
  const context = {} as unknown as Context<NumberSchema>;
  const schema = number();

  it("passes when the predicate is true", async () => {
    const result = await satisfiesRule({
      rule: buildSatisfiesRule(gt(v(2), v(1))),
      value: 1,
      path: "$.a",
      schema,
      context,
    });

    expect(result).toBeUndefined();
  });

  it("fails when the predicate is false", async () => {
    const result = await satisfiesRule({
      rule: buildSatisfiesRule(gt(v(1), v(2))),
      value: 1,
      path: "$.a",
      schema,
      context,
    });

    expect(result).toEqual({
      code: "satisfies",
      message: 'The value for schema $.a does not satisfy the predicate "gt"',
    });
  });

  it("passes when the predicate cannot be evaluated", async () => {
    const result = await satisfiesRule({
      rule: buildSatisfiesRule(gt(v(undefined as unknown as number), v(1))),
      value: 1,
      path: "$.a",
      schema,
      context,
    });

    expect(result).toBeUndefined();
  });
});
