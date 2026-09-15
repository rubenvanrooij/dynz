import { boolean, eq, ref, string, v, validate } from "dynz";
import { describe, expect, it } from "vitest";
import { defineFunnel, step, transition } from "./define";
import { getFunnelPath } from "./resolve";
import { getFunnelSchema } from "./schema";

describe("getFunnelSchema", () => {
  it("merges each step's schema under its step id, every step required by default", () => {
    const funnel = defineFunnel({
      initial: "a",
      steps: [step("a", boolean(), { next: [transition("b")] }), step("b", string(), { next: [transition(null)] })],
    });

    const schema = getFunnelSchema(funnel) as { type: string; fields: Record<string, { type: string }> };

    expect(schema.type).toBe("object");
    expect(Object.keys(schema.fields)).toEqual(["a", "b"]);
    expect(schema.fields.a?.type).toBe("boolean");
    expect(schema.fields.b?.type).toBe("string");
  });

  it("marks steps outside `includedStepIds` as `included: false`, leaving the rest untouched", () => {
    const funnel = defineFunnel({
      initial: "a",
      steps: [step("a", boolean(), { next: [transition("b")] }), step("b", string(), { next: [transition(null)] })],
    });

    const schema = getFunnelSchema(funnel, ["a"]) as { fields: Record<string, { included?: boolean }> };

    expect(schema.fields.a?.included).toBeUndefined();
    expect(schema.fields.b?.included).toBe(false);
  });

  it("without includedStepIds, validating a submission that skipped a branch fails on the skipped step", async () => {
    // Reproduces the real bug: a step never reached by `next` (given these values) must
    // not still be required on the merged schema.
    const funnel = defineFunnel({
      initial: "category",
      steps: [
        step("category", boolean(), {
          next: [transition("onlyForTrue", eq(ref("$.category"), v(true))), transition("common")],
        }),
        step("onlyForTrue", string(), { next: [transition("common")] }),
        step("common", string(), { next: [transition(null)] }),
      ],
    });
    const values = { category: false, common: "ok" };

    const naive = await validate(getFunnelSchema(funnel), undefined, values);
    expect(naive.success).toBe(false);

    const fixed = await validate(getFunnelSchema(funnel, getFunnelPath(funnel, values)), undefined, values);
    expect(fixed).toEqual({ success: true, values });
  });
});
