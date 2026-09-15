import { boolean, eq, ref, string, v } from "dynz";
import { describe, expect, it } from "vitest";
import { defineFunnel, step, transition } from "./define";
import { getFunnelProgress } from "./introspection";

const funnel = defineFunnel({
  initial: "a",
  steps: [
    step("a", boolean(), { next: [transition("b", eq(ref("$.a"), v(true))), transition("c")] }),
    step("b", string(), { next: [transition("c")] }),
    step("c", string(), { next: [transition(null)] }),
  ],
});

describe("getFunnelProgress", () => {
  it("reports index/total/steps for the currently reachable path", () => {
    expect(getFunnelProgress(funnel, "b", { a: true })).toEqual({
      index: 1,
      total: 3,
      steps: ["a", "b", "c"],
    });
  });

  it("reflects a shorter path when a branch is skipped", () => {
    expect(getFunnelProgress(funnel, "c", { a: false })).toEqual({
      index: 1,
      total: 2,
      steps: ["a", "c"],
    });
  });
});
