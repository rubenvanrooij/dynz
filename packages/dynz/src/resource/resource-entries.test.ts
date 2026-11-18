import { describe, expect, it, vi } from "vitest";
import { ref } from "../reference";
import { array, object, string } from "../schemas";
import type { EnabledResource } from "./evaluate-resources";
import { resource } from "./resource";
import {
  changedResourcePaths,
  fieldPathsReadingResources,
  lookupResource,
  reconcileResourceEntries,
  type ResourceEntries,
  settledStates,
  settleResourceEntry,
} from "./resource-entries";

const vehicle = resource({ key: ref("plate"), outcomes: ["found", "not_found"] });

const instance = (path: string, key: string): EnabledResource => ({
  objectPath: "$",
  name: path.split(".").at(-1) as string,
  path,
  resource: vehicle,
  key,
});

describe("reconcileResourceEntries", () => {
  it("starts a pending entry for a new instance", () => {
    const { entries, started } = reconcileResourceEntries({}, [instance("$.vehicle", "A")]);

    expect(entries).toEqual({ "$.vehicle": { status: "pending", key: "A" } });
    expect(started.map(({ path }) => path)).toEqual(["$.vehicle"]);
  });

  it("returns the current entries when nothing changed", () => {
    const current: ResourceEntries = { "$.vehicle": { status: "settled", key: "A", state: { outcome: "found" } } };
    const { entries, started } = reconcileResourceEntries(current, [instance("$.vehicle", "A")]);

    expect(entries).toBe(current);
    expect(started).toEqual([]);
  });

  it("keeps a failed entry for an unchanged key, and restarts it for a new key", () => {
    const current: ResourceEntries = { "$.vehicle": { status: "failed", key: "A", error: new Error("down") } };

    expect(reconcileResourceEntries(current, [instance("$.vehicle", "A")]).entries).toBe(current);
    expect(reconcileResourceEntries(current, [instance("$.vehicle", "B")]).entries).toEqual({
      "$.vehicle": { status: "pending", key: "B" },
    });
  });

  it("drops the entry of an instance that is no longer enabled", () => {
    const current: ResourceEntries = {
      "$.vehicle": { status: "settled", key: "A", state: { outcome: "found" } },
      "$.claims": { status: "pending", key: "L" },
    };
    const { entries, started } = reconcileResourceEntries(current, [instance("$.vehicle", "A")]);

    expect(entries).toEqual({ "$.vehicle": current["$.vehicle"] });
    expect(started).toEqual([]);
  });
});

describe("lookupResource", () => {
  it("settles with the resolver's state", async () => {
    const resolver = vi.fn(async () => ({ outcome: "found" }));

    expect(await lookupResource(instance("$.vehicle", "A"), { vehicle: resolver })).toEqual({
      status: "settled",
      key: "A",
      state: { outcome: "found" },
    });
    expect(resolver).toHaveBeenCalledWith("A", instance("$.vehicle", "A"));
  });

  it("fails when the resolver throws, synchronously or not", async () => {
    const error = new Error("down");

    expect(
      await lookupResource(instance("$.vehicle", "A"), {
        vehicle: () => {
          throw error;
        },
      })
    ).toEqual({ status: "failed", key: "A", error });
    expect(await lookupResource(instance("$.vehicle", "A"), { vehicle: () => Promise.reject(error) })).toEqual({
      status: "failed",
      key: "A",
      error,
    });
  });

  it("rejects when there is no resolver", async () => {
    await expect(lookupResource(instance("$.vehicle", "A"), {})).rejects.toThrow(
      'No resolver for resource "vehicle" at $.vehicle'
    );
  });
});

describe("settleResourceEntry", () => {
  const pending: ResourceEntries = { "$.vehicle": { status: "pending", key: "A" } };

  it("stores a result for the current key", () => {
    expect(
      settleResourceEntry(pending, "$.vehicle", { status: "settled", key: "A", state: { outcome: "found" } })
    ).toEqual({ "$.vehicle": { status: "settled", key: "A", state: { outcome: "found" } } });
  });

  it("ignores a result for a key the instance no longer has, or a dropped instance", () => {
    const result = { status: "settled", key: "OLD", state: { outcome: "found" } } as const;

    expect(settleResourceEntry(pending, "$.vehicle", result)).toBe(pending);
    expect(settleResourceEntry(pending, "$.claims", result)).toBe(pending);
  });
});

describe("settledStates", () => {
  it("keeps only the settled entries", () => {
    expect(
      settledStates({
        "$.vehicle": { status: "settled", key: "A", state: { outcome: "found" } },
        "$.claims": { status: "pending", key: "L" },
        "$.payment": { status: "failed", key: "NL", error: null },
      })
    ).toEqual({ "$.vehicle": { outcome: "found" } });
  });
});

describe("changedResourcePaths", () => {
  it("lists added, removed and replaced states, but not unchanged ones", () => {
    const found = { outcome: "found" };

    expect(
      changedResourcePaths(
        { "$.vehicle": found, "$.claims": { outcome: "found" } },
        { "$.vehicle": found, "$.claims": { outcome: "not_found" }, "$.payment": { outcome: "ok" } }
      )
    ).toEqual(["$.claims", "$.payment"]);
    expect(changedResourcePaths({ "$.vehicle": found }, {})).toEqual(["$.vehicle"]);
  });
});

describe("fieldPathsReadingResources", () => {
  const schema = object({
    plate: string(),
    make: string(),
    drivers: array(object({ licence: string(), years: string() })),
  });

  it("returns the dependents of the changed resources, by resource name", () => {
    expect(fieldPathsReadingResources(["$.vehicle"], { vehicle: ["$.make"], claims: ["$.plate"] }, schema, {})).toEqual(
      ["$.make"]
    );
  });

  it("expands array items against the values, and lists each path once", () => {
    const values = { drivers: [{ licence: "A" }, { licence: "B" }] };

    expect(
      fieldPathsReadingResources(
        ["$.drivers.[0].driverClaims", "$.drivers.[1].driverClaims"],
        { driverClaims: ["$.drivers.[].years"] },
        schema,
        values
      )
    ).toEqual(["$.drivers.[0].years", "$.drivers.[1].years"]);
  });
});
