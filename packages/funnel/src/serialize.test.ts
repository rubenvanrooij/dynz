import { boolean, eq, ref, string } from "dynz";
import { describe, expect, it } from "vitest";
import { defineFunnel, step, transition } from "./define";
import { serializeFunnel } from "./serialize";

describe("serializeFunnel", () => {
  it("produces a plain JSON string that round-trips losslessly", () => {
    const stepASchema = boolean();
    const stepBSchema = string();

    const funnel = defineFunnel({
      initial: "a",
      steps: [
        step("a", stepASchema, { next: [transition("b", eq(ref("$.a"), true)), transition(null)] }),
        step("b", stepBSchema, { next: [transition(null)] }),
      ],
    });

    const json = serializeFunnel(funnel);
    const parsed = JSON.parse(json);

    expect(parsed.type).toBe("funnel");
    expect(parsed.initial).toBe("a");
    expect(parsed.steps.map((s: { id: string }) => s.id)).toEqual(["a", "b"]);

    // predicates are already plain data — must survive serialization verbatim
    expect(parsed.steps[0].next[0]).toEqual({
      to: "b",
      when: {
        type: "eq",
        left: { type: "_dref", path: "$.a" },
        right: { type: "st", value: true },
      },
    });

    // schemas: compare against the same schema JSON.stringify-round-tripped on its
    // own, since the fluent builder objects carry (non-serializable) methods that
    // JSON.stringify silently drops — this is exactly the property under test.
    expect(parsed.steps[0].schema).toEqual(JSON.parse(JSON.stringify(stepASchema)));
    expect(parsed.steps[1].schema).toEqual(JSON.parse(JSON.stringify(stepBSchema)));

    // idempotent: re-serializing the parsed JSON reproduces the same string
    expect(JSON.stringify(parsed)).toBe(json);
  });
});
