import { boolean, eq, number, object, ref, string, v } from "dynz";
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
