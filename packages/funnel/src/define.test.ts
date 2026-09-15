import { boolean, eq, ref, string, v } from "dynz";
import { describe, expect, it } from "vitest";
import { defineFunnel, step, transition } from "./define";

describe("transition", () => {
  it("omits `when` for an unconditional transition", () => {
    expect(transition("next")).toEqual({ to: "next" });
  });

  it("includes `when` when provided", () => {
    const t = transition("next", eq(ref("$.a"), v(1)));
    expect(t).toEqual({
      to: "next",
      when: { type: "eq", left: { type: "_dref", path: "$.a" }, right: { type: "st", value: 1 } },
    });
  });
});

describe("step", () => {
  it("builds a step, omitting unset optional properties", () => {
    const schema = string();
    const s = step("a", schema, { next: [transition(null)] });
    expect(s.id).toBe("a");
    expect(s.schema).toBe(schema);
    expect(s.next).toEqual([{ to: null }]);
    expect(s).not.toHaveProperty("included");
    expect(s).not.toHaveProperty("meta");
  });

  it("keeps `included` and `meta` when provided", () => {
    const s = step("a", string(), { next: [transition(null)], included: false, meta: { title: "A" } });
    expect(s.included).toBe(false);
    expect(s.meta).toEqual({ title: "A" });
  });
});

describe("defineFunnel", () => {
  it("builds a funnel definition", () => {
    const schema = string();
    const funnel = defineFunnel({
      initial: "a",
      steps: [step("a", schema, { next: [transition(null)] })],
    });

    expect(funnel.type).toBe("funnel");
    expect(funnel.initial).toBe("a");
    expect(funnel.steps).toHaveLength(1);
    expect(funnel.steps[0]?.id).toBe("a");
    expect(funnel.steps[0]?.schema).toBe(schema);
    expect(funnel.steps[0]?.next).toEqual([{ to: null }]);
  });

  it("throws on duplicate step ids", () => {
    expect(() =>
      defineFunnel({
        initial: "a",
        steps: [step("a", string(), { next: [transition(null)] }), step("a", boolean(), { next: [transition(null)] })],
      })
    ).toThrow(/duplicate step id/);
  });

  it("throws when `initial` is not a defined step", () => {
    expect(() =>
      defineFunnel({
        initial: "missing",
        steps: [step("a", string(), { next: [transition(null)] })],
      })
    ).toThrow(/initial step "missing"/);
  });

  it("throws when a transition targets an unknown step", () => {
    expect(() =>
      defineFunnel({
        initial: "a",
        steps: [step("a", string(), { next: [transition("missing")] })],
      })
    ).toThrow(/unknown step "missing"/);
  });
});
