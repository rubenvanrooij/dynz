import { act, cleanup } from "@testing-library/react";
import { discriminatedUnion, object, string } from "dynz";
import { afterEach, describe, expect, it } from "vitest";
import { renderDynzHook } from "../testing/render-with-form";
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

afterEach(cleanup);

describe("useDiscriminatedUnionKeyValues", () => {
  it("returns every discriminator value of a top-level union", () => {
    const { result } = renderDynzHook(flat, {}, () => useDiscriminatedUnionKeyValues("payment"));

    expect(result.current).toEqual([
      { enabled: true, value: "ideal" },
      { enabled: true, value: "sepa" },
    ]);
  });

  it("resolves the inner union of the selected outer variant", () => {
    const { result } = renderDynzHook(nested, { payment: { region: "eu" } }, () =>
      useDiscriminatedUnionKeyValues("payment.method")
    );

    expect(result.current.map((option) => option.value)).toEqual(["ideal", "sepa"]);
  });

  it("follows the outer discriminator when it changes", () => {
    const { result, form } = renderDynzHook(nested, { payment: { region: "eu" } }, () =>
      useDiscriminatedUnionKeyValues("payment.method")
    );

    expect(result.current.map((option) => option.value)).toEqual(["ideal", "sepa"]);

    act(() => form.setValue("payment.region", "us"));

    expect(result.current.map((option) => option.value)).toEqual(["ach", "card"]);
  });
});
