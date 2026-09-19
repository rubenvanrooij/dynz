import { boolean, eq, number, object, ref, schemaRef, string, v } from "dynz";
import { describe, expect, it } from "vitest";
import { defineFunnel, step, transition } from "./define";
import { getFunnelPath, isStepIncluded, resolveNextStep } from "./resolve";

const funnel = defineFunnel({
  initial: "personalInfo",
  steps: [
    step("personalInfo", object({ hasJob: boolean() }), {
      next: [transition("employment", eq(ref("$.personalInfo.hasJob"), v(true))), transition("preferences")],
    }),
    step("employment", object({ income: number() }), {
      next: [transition("preferences")],
    }),
    step("preferences", object({ contactMethod: string() }), {
      included: eq(ref("$.personalInfo.hasJob"), v(true)),
      next: [transition(null)],
    }),
  ],
});

describe("resolveNextStep", () => {
  it("takes the first matching predicate-guarded transition", () => {
    expect(resolveNextStep(funnel, "personalInfo", { personalInfo: { hasJob: true } })).toBe("employment");
  });

  it("falls back to the unconditional transition when no predicate matches", () => {
    expect(resolveNextStep(funnel, "personalInfo", { personalInfo: { hasJob: false } })).toBe("preferences");
  });

  it("resolves a later step's transition against an earlier step's values (cross-step predicate)", () => {
    expect(resolveNextStep(funnel, "employment", { personalInfo: { hasJob: true } })).toBe("preferences");
  });

  it("returns null when no transition matches and there is no fallback", () => {
    expect(resolveNextStep(funnel, "preferences", {})).toBeNull();
  });

  it("throws for an unknown step id", () => {
    expect(() => resolveNextStep(funnel, "unknown", {})).toThrow(/unknown step "unknown"/);
  });
});

describe("isStepIncluded", () => {
  it("defaults to true when `included` is not set", () => {
    expect(isStepIncluded(funnel, "personalInfo", {})).toBe(true);
  });

  it("resolves a boolean `included`", () => {
    const f = defineFunnel({
      initial: "a",
      steps: [step("a", boolean(), { included: false, next: [transition(null)] })],
    });
    expect(isStepIncluded(f, "a", {})).toBe(false);
  });

  it("resolves a predicate `included` against another step's values", () => {
    expect(isStepIncluded(funnel, "preferences", { personalInfo: { hasJob: true } })).toBe(true);
    expect(isStepIncluded(funnel, "preferences", { personalInfo: { hasJob: false } })).toBe(false);
  });
});

describe("resolveNextStep with a schemaRef step", () => {
  const refFunnel = defineFunnel({
    initial: "a",
    steps: [
      step("a", schemaRef("mem://a"), {
        next: [transition("b", eq(ref("$.a.flag"), v(true))), transition("c")],
      }),
      step("b", boolean(), { next: [transition(null)] }),
      step("c", boolean(), { next: [transition(null)] }),
    ],
  });

  it("throws when a transition's predicate needs a step's schema that hasn't been resolved", () => {
    expect(() => resolveNextStep(refFunnel, "a", { a: { flag: true } })).toThrow(/has not been resolved/);
  });

  it("resolves correctly once the referenced step's schema is provided via `resolvedSchemas`", () => {
    const resolvedSchemas = { a: object({ flag: boolean() }) };
    expect(resolveNextStep(refFunnel, "a", { a: { flag: true } }, resolvedSchemas)).toBe("b");
    expect(resolveNextStep(refFunnel, "a", { a: { flag: false } }, resolvedSchemas)).toBe("c");
  });
});

describe("getFunnelPath", () => {
  it("walks the reachable steps given the current values", () => {
    expect(getFunnelPath(funnel, { personalInfo: { hasJob: true } })).toEqual([
      "personalInfo",
      "employment",
      "preferences",
    ]);
    expect(getFunnelPath(funnel, { personalInfo: { hasJob: false } })).toEqual(["personalInfo", "preferences"]);
  });

  it("stops instead of looping forever when a definition cycles with the same values", () => {
    const cyclic = defineFunnel({
      initial: "a",
      steps: [step("a", boolean(), { next: [transition("b")] }), step("b", boolean(), { next: [transition("a")] })],
    });

    expect(getFunnelPath(cyclic, {})).toEqual(["a", "b"]);
  });
});
