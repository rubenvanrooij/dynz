import { discriminatedUnion, eq, neq, object, options, ref, string } from "dynz";
import { describe, expect, it } from "vitest";
import { mountComposable } from "../testing/mount-composable";
import { useDiscriminatedUnionKeyValues } from "./use-discriminated-union-key-values";
import { useDynzForm } from "./use-dynz-form";
import { useIsIncluded } from "./use-is-included";
import { useIsMutable } from "./use-is-mutable";
import { useIsRequired } from "./use-is-required";
import { useOptions } from "./use-options";
import { usePredicate } from "./use-predicate";

/**
 * These tests are the reason the Vue package needs no dependency collection: every
 * assertion below is "change a controlling value, read the computed again". If Vue's
 * automatic tracking did not pick the dependency up, the second read would be stale.
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
  const form = useDynzForm({ schema, initialValues, provideContext: false });
  const { result } = mountComposable(create, form.context);

  return { form, result };
}

describe("useIsIncluded", () => {
  it("resolves the schema condition against the initial values", () => {
    const { result } = setup(() => useIsIncluded("companyName"), { plan: "free" });

    expect(result.value).toBe(false);
  });

  it("flips when the controlling field changes", async () => {
    const { form, result } = setup(() => useIsIncluded("companyName"), { plan: "free" });

    expect(result.value).toBe(false);

    form.values.plan = "enterprise";

    expect(result.value).toBe(true);
  });

  it("accepts a getter so the field name itself can be reactive", () => {
    const form = useDynzForm({ schema, initialValues: { plan: "enterprise" }, provideContext: false });
    let name = "companyName";
    const { result } = mountComposable(() => useIsIncluded(() => name), form.context);

    expect(result.value).toBe(true);

    name = "slug";
    form.values.plan = "free";

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

    form.values.plan = "enterprise";

    expect(result.value).toBe(true);
  });
});

describe("useIsMutable", () => {
  it("tracks the controlling field", () => {
    const { form, result } = setup(() => useIsMutable("slug"), { plan: "free" });

    expect(result.value).toBe(true);

    form.values.plan = "pro";

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
    const form = useDynzForm({ schema: nestedSchema, initialValues: { hasAddress: false }, provideContext: false });
    const { result } = mountComposable(() => useIsIncluded("address.zip"), form.context);

    expect(result.value).toBe(false);
  });

  it("picks up an ancestor becoming included, even though the leaf is unconditional", () => {
    const form = useDynzForm({ schema: nestedSchema, initialValues: { hasAddress: false }, provideContext: false });
    const { result } = mountComposable(() => useIsIncluded("address.street"), form.context);

    expect(result.value).toBe(false);

    // The leaf carries no condition at all — only the ancestor does. This is the case
    // React has to hand-wire dependencies for; Vue re-tracks it on every run.
    form.values.hasAddress = true;

    expect(result.value).toBe(true);
  });

  it("resolves required on a nested path", () => {
    const form = useDynzForm({ schema: nestedSchema, initialValues: { hasAddress: true }, provideContext: false });
    const { result } = mountComposable(() => useIsRequired("address.zip"), form.context);

    expect(result.value).toBe(true);

    form.values.hasAddress = false;

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
    const form = useDynzForm({
      schema: unionSchema,
      initialValues: { contactDetails: { type: "email" } },
      provideContext: false,
    });
    const { result } = mountComposable(
      () => useIsIncluded(["contactDetails.email", "contactDetails.phone"]),
      form.context
    );

    expect(result.value).toEqual([true, false]);
  });

  it("re-resolves when the discriminator changes", () => {
    const form = useDynzForm({
      schema: unionSchema,
      initialValues: { contactDetails: { type: "email" } },
      provideContext: false,
    });
    const { result } = mountComposable(() => useIsIncluded("contactDetails.phone"), form.context);

    expect(result.value).toBe(false);

    (form.values.contactDetails as { type: string }).type = "phone";

    expect(result.value).toBe(true);
  });

  it("lists the discriminator values", () => {
    const form = useDynzForm({ schema: unionSchema, provideContext: false });
    const { result } = mountComposable(() => useDiscriminatedUnionKeyValues("contactDetails"), form.context);

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
    const form = useDynzForm({ schema: optionsSchema, initialValues: { country: "us" }, provideContext: false });
    const { result } = mountComposable(() => useOptions("shipping"), form.context);

    expect(result.value).toEqual([
      { value: "pickup", enabled: true },
      { value: "standard", enabled: true },
      { value: "sameDay", enabled: false },
      { value: "never", enabled: false },
    ]);
  });

  it("re-resolves conditional options when the controlling field changes", () => {
    const form = useDynzForm({ schema: optionsSchema, initialValues: { country: "us" }, provideContext: false });
    const { result } = mountComposable(() => useOptions("shipping"), form.context);

    expect(result.value.find((option) => option.value === "sameDay")?.enabled).toBe(false);

    form.values.country = "nl";

    expect(result.value.find((option) => option.value === "sameDay")?.enabled).toBe(true);
  });
});

describe("usePredicate", () => {
  it("evaluates a predicate against the live values", () => {
    const { form, result } = setup(() => usePredicate(neq(ref("plan"), "free")), { plan: "free" });

    expect(result.value).toBe(false);

    form.values.plan = "pro";

    expect(result.value).toBe(true);
  });
});

describe("context guard", () => {
  it("throws a helpful error when no dynz context was provided", () => {
    expect(() => mountComposable(() => useIsIncluded("plan"))).toThrow(/No dynz context found/);
  });
});
