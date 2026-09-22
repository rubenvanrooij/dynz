import { array, discriminatedUnion, object, options, string } from "dynz";
import { describe, expect, it } from "vitest";
import { mountDynzForm } from "../testing/mount-form";
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
  note: string(),
});

const initialValues = {
  subscriptions: [{ audience: "business" as const }, { audience: "personal" as const }],
};

describe("useOptions inside a discriminated union", () => {
  it("resolves each array element against its own variant", () => {
    const { result: first } = mountDynzForm({ schema, initialValues }, () => useOptions("subscriptions[0].plan"));
    const { result: second } = mountDynzForm({ schema, initialValues }, () => useOptions("subscriptions[1].plan"));

    expect(first.value.map((option) => option.value)).toEqual(["team", "enterprise"]);
    expect(second.value.map((option) => option.value)).toEqual(["free", "pro"]);
  });

  it("follows the discriminator when it changes", () => {
    const { form, result } = mountDynzForm({ schema, initialValues }, () => useOptions("subscriptions[0].plan"));

    expect(result.value.map((option) => option.value)).toEqual(["team", "enterprise"]);

    // Cast: the adapter's typed-path map resolves a union *discriminator* to `never`, so
    // it rejects every value. Separate pre-existing gap in SchemaValues, not this path.
    (form.setFieldValue as (path: string, value: unknown) => void)("subscriptions[0].audience", "personal");

    expect(result.value.map((option) => option.value)).toEqual(["free", "pro"]);
  });
});
