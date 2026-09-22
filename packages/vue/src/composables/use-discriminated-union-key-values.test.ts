import { discriminatedUnion, object, string } from "dynz";
import { describe, expect, it } from "vitest";
import { mountDynzForm } from "../testing/mount-form";
import { useDiscriminatedUnionKeyValues } from "./use-discriminated-union-key-values";

const flat = object({
  payment: discriminatedUnion("kind", [
    { kind: "ideal", bank: string() },
    { kind: "sepa", iban: string() },
  ]),
});

// A union nested inside a union: flipping the outer discriminator swaps which inner
// union applies, so the list of inner key values changes with it.
const nested = object({
  payment: discriminatedUnion("region", [
    {
      region: "eu",
      method: discriminatedUnion("kind", [
        { kind: "ideal", bank: string() },
        { kind: "sepa", iban: string() },
      ]),
    },
    {
      region: "us",
      method: discriminatedUnion("kind", [
        { kind: "ach", routing: string() },
        { kind: "card", pan: string() },
      ]),
    },
  ]),
});

describe("useDiscriminatedUnionKeyValues", () => {
  it("returns every discriminator value of a top-level union", () => {
    const { result } = mountDynzForm({ schema: flat }, () => useDiscriminatedUnionKeyValues("payment"));

    expect(result.value).toEqual([
      { enabled: true, value: "ideal" },
      { enabled: true, value: "sepa" },
    ]);
  });

  it("resolves the inner union of the selected outer variant", () => {
    const { result } = mountDynzForm({ schema: nested, initialValues: { payment: { region: "eu" } } }, () =>
      useDiscriminatedUnionKeyValues("payment.method")
    );

    expect(result.value.map((option) => option.value)).toEqual(["ideal", "sepa"]);
  });

  it("follows the outer discriminator when it changes", () => {
    const { form, result } = mountDynzForm({ schema: nested, initialValues: { payment: { region: "eu" } } }, () =>
      useDiscriminatedUnionKeyValues("payment.method")
    );

    expect(result.value.map((option) => option.value)).toEqual(["ideal", "sepa"]);

    // Cast: the adapter's typed-path map resolves a union *discriminator* to `never`, so
    // it rejects every value. Separate pre-existing gap in SchemaValues, not this path.
    (form.setFieldValue as (path: string, value: unknown) => void)("payment.region", "us");

    expect(result.value.map((option) => option.value)).toEqual(["ach", "card"]);
  });
});
