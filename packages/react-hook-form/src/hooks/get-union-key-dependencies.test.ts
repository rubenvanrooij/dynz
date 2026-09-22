import { array, discriminatedUnion, number, object, string } from "dynz";
import { describe, expect, it } from "vitest";
import { getUnionKeyDependencies } from "./get-union-key-dependencies";

describe("getUnionKeyDependencies", () => {
  it("returns nothing for a path that crosses no union", () => {
    const schema = object({ address: object({ zip: string() }) });

    expect(getUnionKeyDependencies("$.address.zip", schema)).toEqual([]);
  });

  it("returns the discriminator of a union on the path", () => {
    const schema = object({
      expense: discriminatedUnion("kind", [
        { kind: "hours", amount: number() },
        { kind: "money", amount: string() },
      ]),
    });

    expect(getUnionKeyDependencies("$.expense.amount", schema)).toEqual(["expense.kind"]);
  });

  it("includes the array index, so sibling elements are watched separately", () => {
    const schema = object({
      items: array(
        discriminatedUnion("kind", [
          { kind: "hours", amount: number() },
          { kind: "money", amount: string() },
        ])
      ),
    });

    expect(getUnionKeyDependencies("$.items.0.amount", schema)).toEqual(["items.0.kind"]);
    expect(getUnionKeyDependencies("$.items.1.amount", schema)).toEqual(["items.1.kind"]);
  });

  it("returns the discriminator when the union itself is the target", () => {
    const schema = object({
      expense: discriminatedUnion("kind", [{ kind: "hours" }, { kind: "money" }]),
    });

    expect(getUnionKeyDependencies("$.expense", schema)).toEqual(["expense.kind"]);
  });

  it("returns every discriminator for a union nested inside a union", () => {
    const schema = object({
      payment: discriminatedUnion("region", [
        {
          region: "eu",
          method: discriminatedUnion("kind", [
            { kind: "ideal", bank: string() },
            { kind: "sepa", iban: string() },
          ]),
        },
        { region: "us", method: discriminatedUnion("kind", [{ kind: "ach", routing: string() }]) },
      ]),
    });

    const dependencies = getUnionKeyDependencies("$.payment.method.bank", schema);

    expect(dependencies).toContain("payment.region");
    expect(dependencies).toContain("payment.method.kind");
  });

  it("does not repeat a discriminator that several variants share", () => {
    // Both outer variants nest a union on the same key, so the same dependency is
    // reachable twice — it must still appear once.
    const schema = object({
      payment: discriminatedUnion("region", [
        { region: "eu", method: discriminatedUnion("kind", [{ kind: "ideal", ref: string() }]) },
        { region: "us", method: discriminatedUnion("kind", [{ kind: "ach", ref: string() }]) },
      ]),
    });

    const dependencies = getUnionKeyDependencies("$.payment.method.ref", schema);

    expect(dependencies).toEqual([...new Set(dependencies)]);
    expect(dependencies.filter((dep) => dep === "payment.method.kind")).toHaveLength(1);
  });
});
