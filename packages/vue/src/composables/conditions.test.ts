import { discriminatedUnion, eq, neq, object, options, ref, string } from "dynz";
import { describe, expect, it } from "vitest";
import { mountComposable } from "../testing/mount-composable";
import { mountDynzForm } from "../testing/mount-form";
import { useIsIncluded } from "./use-is-included";
import { useIsMutable } from "./use-is-mutable";
import { useIsRequired } from "./use-is-required";
import { useOptions } from "./use-options";
import { usePredicate } from "./use-predicate";

/**
 * These tests are the reason the Vue package needs no dependency collection: every
 * assertion below is "change a controlling value, read the computed again". If Vue's
 * automatic tracking did not pick the dependency up, the second read would be stale.
 *
 * `form.values` is vee-validate's own read-only proxy — mutations go through
 * `form.setFieldValue`, not direct property assignment.
 */

const schema = object({
  plan: options(["free", "pro", "enterprise"] as const),
  companyName: string()
    .min(1)
    .setIncluded(eq(ref("plan"), "enterprise")),
  vatNumber: string().setRequired(eq(ref("plan"), "enterprise")),
  slug: string().setMutable(eq(ref("plan"), "free")),
});

function setup<T>(create: () => T, initialValues: Record<string, unknown> = {}) {
  const { form, result } = mountDynzForm({ schema, initialValues }, create);

  return { form, result };
}

describe("useIsIncluded", () => {
  it("resolves the schema condition against the initial values", () => {
    const { result } = setup(() => useIsIncluded("companyName"), { plan: "free" });

    expect(result.value).toBe(false);
  });

  it("flips when the controlling field changes", () => {
    const { form, result } = setup(() => useIsIncluded("companyName"), { plan: "free" });

    expect(result.value).toBe(false);

    form.setFieldValue("plan", "enterprise");

    expect(result.value).toBe(true);
  });

  it("accepts a getter so the field name itself can be reactive", () => {
    let name = "companyName";
    const { form, result } = mountDynzForm({ schema, initialValues: { plan: "enterprise" } }, () =>
      useIsIncluded(() => name)
    );

    expect(result.value).toBe(true);

    name = "slug";
    form.setFieldValue("plan", "free");

    expect(result.value).toBe(true);
  });

  it("resolves an array of names in one go", () => {
    const { result } = setup(() => useIsIncluded(["companyName", "slug"]), { plan: "free" });

    expect(result.value).toEqual([false, true]);
  });
});

describe("useIsRequired", () => {
  it("tracks the controlling field", () => {
    const { form, result } = setup(() => useIsRequired("vatNumber"), { plan: "free" });

    expect(result.value).toBe(false);

    form.setFieldValue("plan", "enterprise");

    expect(result.value).toBe(true);
  });
});

describe("useIsMutable", () => {
  it("tracks the controlling field", () => {
    const { form, result } = setup(() => useIsMutable("slug"), { plan: "free" });

    expect(result.value).toBe(true);

    form.setFieldValue("plan", "pro");

    expect(result.value).toBe(false);
  });
});

describe("nested schemas", () => {
  const nestedSchema = object({
    hasAddress: options([true, false] as const),
    address: object({
      street: string(),
      zip: string().setRequired(eq(ref("$.hasAddress"), true)),
    }).setIncluded(eq(ref("hasAddress"), true)),
  });

  it("short-circuits to false when an ancestor is excluded", () => {
    const { result } = mountDynzForm({ schema: nestedSchema, initialValues: { hasAddress: false } }, () =>
      useIsIncluded("address.zip")
    );

    expect(result.value).toBe(false);
  });

  it("picks up an ancestor becoming included, even though the leaf is unconditional", () => {
    const { form, result } = mountDynzForm({ schema: nestedSchema, initialValues: { hasAddress: false } }, () =>
      useIsIncluded("address.street")
    );

    expect(result.value).toBe(false);

    // The leaf carries no condition at all — only the ancestor does. This is the case
    // React has to hand-wire dependencies for; Vue re-tracks it on every run.
    form.setFieldValue("hasAddress", true);

    expect(result.value).toBe(true);
  });

  it("resolves required on a nested path", () => {
    const { form, result } = mountDynzForm({ schema: nestedSchema, initialValues: { hasAddress: true } }, () =>
      useIsRequired("address.zip")
    );

    expect(result.value).toBe(true);

    form.setFieldValue("hasAddress", false);

    // Excluded ancestor wins over the leaf's own condition.
    expect(result.value).toBe(false);
  });
});

describe("discriminated unions", () => {
  const unionSchema = object({
    name: string(),
    contactDetails: discriminatedUnion("type", [
      { type: "email", email: string() },
      { type: "phone", phone: string() },
    ]),
  });

  it("excludes members that do not match the discriminator", () => {
    const { result } = mountDynzForm(
      { schema: unionSchema, initialValues: { contactDetails: { type: "email" } } },
      () => useIsIncluded(["contactDetails.email", "contactDetails.phone"])
    );

    expect(result.value).toEqual([true, false]);
  });

  it("re-resolves when the discriminator changes", () => {
    const { form, result } = mountDynzForm(
      { schema: unionSchema, initialValues: { contactDetails: { type: "email" } } },
      () => useIsIncluded("contactDetails.phone")
    );

    expect(result.value).toBe(false);

    form.setFieldValue("contactDetails.type" as never, "phone" as never);

    expect(result.value).toBe(true);
  });

  it("lists the discriminator values", () => {
    const { result } = mountDynzForm({ schema: unionSchema }, () => useOptions("contactDetails.type"));

    expect(result.value).toEqual([
      { value: "email", enabled: true },
      { value: "phone", enabled: true },
    ]);
  });
});

describe("useOptions", () => {
  const optionsSchema = object({
    country: options(["nl", "us"] as const),
    shipping: options([
      "pickup",
      { value: "standard", enabled: true },
      { value: "sameDay", enabled: eq(ref("$.country"), "nl") },
      { value: "never", enabled: false },
    ]),
  });

  it("returns every option with its resolved enabled flag", () => {
    const { result } = mountDynzForm({ schema: optionsSchema, initialValues: { country: "us" } }, () =>
      useOptions("shipping")
    );

    expect(result.value).toEqual([
      { value: "pickup", enabled: true },
      { value: "standard", enabled: true },
      { value: "sameDay", enabled: false },
      { value: "never", enabled: false },
    ]);
  });

  it("re-resolves conditional options when the controlling field changes", () => {
    const { form, result } = mountDynzForm({ schema: optionsSchema, initialValues: { country: "us" } }, () =>
      useOptions("shipping")
    );

    expect(result.value.find((option) => option.value === "sameDay")?.enabled).toBe(false);

    form.setFieldValue("country", "nl");

    expect(result.value.find((option) => option.value === "sameDay")?.enabled).toBe(true);
  });
});

describe("usePredicate", () => {
  it("evaluates a predicate against the live values", () => {
    const { form, result } = setup(() => usePredicate(neq(ref("plan"), "free")), { plan: "free" });

    expect(result.value).toBe(false);

    form.setFieldValue("plan", "pro");

    expect(result.value).toBe(true);
  });
});

describe("context guard", () => {
  it("throws a helpful error when no dynz context was provided", () => {
    expect(() => mountComposable(() => useIsIncluded("plan"))).toThrow(/No dynz context found/);
  });
});
