import { act, cleanup } from "@testing-library/react";
import { discriminatedUnion, eq, object, ref, string } from "dynz";
import { afterEach, describe, expect, it } from "vitest";
import { renderDynzHook } from "../testing/render-with-form";
import { useIsIncluded } from "./use-is-included";

// `note` is declared by both variants, but only the SECOND one gates it on `wantNote`.
// Dependency collection has no values to narrow with, so it has to walk every variant —
// reading only the first would leave `wantNote` unwatched and the hook would never
// re-render when it changes.
const schema = object({
  wantNote: string(),
  expense: discriminatedUnion("kind", [
    { kind: "hours", note: string() },
    { kind: "money", note: string().setIncluded(eq(ref("$.wantNote"), "yes")) },
  ]),
});

afterEach(cleanup);

describe("useConditionalProperty across discriminated union variants", () => {
  it("resolves a condition declared only on a non-first variant", () => {
    const { result } = renderDynzHook(schema, { wantNote: "no", expense: { kind: "money" } }, () =>
      useIsIncluded("expense.note")
    );

    expect(result.current).toBe(false);
  });

  it("re-renders when a field only the non-first variant depends on changes", () => {
    const { result, form } = renderDynzHook(schema, { wantNote: "no", expense: { kind: "money" } }, () =>
      useIsIncluded("expense.note")
    );

    expect(result.current).toBe(false);

    act(() => form.setValue("wantNote", "yes"));

    expect(result.current).toBe(true);
  });

  it("keeps the first variant's unconditional field included", () => {
    const { result } = renderDynzHook(schema, { wantNote: "no", expense: { kind: "hours" } }, () =>
      useIsIncluded("expense.note")
    );

    expect(result.current).toBe(true);
  });

  it("re-renders when the discriminator itself changes", () => {
    const { result, form } = renderDynzHook(schema, { wantNote: "no", expense: { kind: "hours" } }, () =>
      useIsIncluded("expense.note")
    );

    expect(result.current).toBe(true);

    act(() => form.setValue("expense.kind", "money"));

    expect(result.current).toBe(false);
  });
});
