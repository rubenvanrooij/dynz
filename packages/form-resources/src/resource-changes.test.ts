import { array, object, string } from "dynz";
import { describe, expect, it } from "vitest";
import { changedResourcePaths, fieldPathsReadingResources } from "./resource-changes";

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
