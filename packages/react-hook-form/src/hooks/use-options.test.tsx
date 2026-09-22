import { act, cleanup } from "@testing-library/react";
import { array, discriminatedUnion, eq, object, options, ref, string } from "dynz";
import { afterEach, describe, expect, it } from "vitest";
import { renderDynzHook } from "../testing/render-with-form";
import { useOptions } from "./use-options";

// Both variants declare `plan` with different option lists, so the discriminator is the
// only thing that says which list to render.
const schema = object({
  subscriptions: array(
    discriminatedUnion("audience", [
      { audience: "personal", plan: options(["free", "pro"] as const) },
      { audience: "business", plan: options(["team", "enterprise"] as const) },
    ])
  ),
});

const values = { subscriptions: [{ audience: "business" as const }, { audience: "personal" as const }] };

afterEach(cleanup);

describe("useOptions inside a discriminated union", () => {
  it("resolves each array element against its own variant", () => {
    const { result: first } = renderDynzHook(schema, values, () => useOptions("subscriptions.0.plan"));
    const { result: second } = renderDynzHook(schema, values, () => useOptions("subscriptions.1.plan"));

    expect(first.current.map((option) => option.value)).toEqual(["team", "enterprise"]);
    expect(second.current.map((option) => option.value)).toEqual(["free", "pro"]);
  });

  it("follows the discriminator when it changes", () => {
    // Regression guard: the resolved OptionsSchema depends on the discriminator, so
    // without a watch on it this hook never re-renders and keeps the outgoing variant's
    // options.
    const { result, form } = renderDynzHook(schema, values, () => useOptions("subscriptions.0.plan"));

    expect(result.current.map((option) => option.value)).toEqual(["team", "enterprise"]);

    act(() => form.setValue("subscriptions.0.audience", "personal"));

    expect(result.current.map((option) => option.value)).toEqual(["free", "pro"]);
  });
});

describe("useOptions with both union-key and condition dependencies", () => {
  // The options field sits inside a union *and* gates one option on another field, so the
  // dependency array has to carry both kinds at once. Each is covered alone above.
  const schema = object({
    hasContract: string(),
    subscription: discriminatedUnion("audience", [
      { audience: "personal", plan: options(["free", "pro"] as const) },
      {
        audience: "business",
        plan: options(["team", { value: "enterprise", enabled: eq(ref("$.hasContract"), "yes") }] as const),
      },
    ]),
  });

  const values = { hasContract: "no", subscription: { audience: "business" as const } };

  it("resolves the variant's options and its conditional enabled flags together", () => {
    const { result } = renderDynzHook(schema, values, () => useOptions("subscription.plan"));

    expect(result.current).toEqual([
      { value: "team", enabled: true },
      { value: "enterprise", enabled: false },
    ]);
  });

  it("re-renders on the condition's field", () => {
    const { result, form } = renderDynzHook(schema, values, () => useOptions("subscription.plan"));

    expect(result.current.find((option) => option.value === "enterprise")?.enabled).toBe(false);

    act(() => form.setValue("hasContract", "yes"));

    expect(result.current.find((option) => option.value === "enterprise")?.enabled).toBe(true);
  });

  it("re-renders on the discriminator", () => {
    const { result, form } = renderDynzHook(schema, values, () => useOptions("subscription.plan"));

    expect(result.current.map((option) => option.value)).toEqual(["team", "enterprise"]);

    act(() => form.setValue("subscription.audience", "personal"));

    expect(result.current.map((option) => option.value)).toEqual(["free", "pro"]);
  });
});
