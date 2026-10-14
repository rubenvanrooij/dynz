import { describe, expect, it } from "vitest";
import { eq, resolve, unpackResourceRef } from "../functions";
import { ref } from "../reference";
import { array, boolean, discriminatedUnion, object, string } from "../schemas";
import { findResources, getResources } from "./find-resource";
import { type ResourceStates, resource, resourceRef } from "./resource";

type Vehicle = { make: string; specs: { doors: number } };

const vehicle = () =>
  resource<Vehicle>({
    key: ref("plate"),
    enabled: eq(ref("hasCar"), true),
    outcomes: ["found", "not_found"],
  });

const schema = object({
  hasCar: boolean(),
  plate: string(),
  manualDetails: object({ make: string() }),
}).setResources({ vehicle: vehicle() });

const found: ResourceStates = {
  "$.vehicle": { outcome: "found", data: { make: "Volvo", specs: { doors: 5 } } },
};

const unpack = (refPath: string, path: string, resources?: ResourceStates) =>
  unpackResourceRef(resourceRef(refPath), path, { schema, values: {}, resources });

describe("getResources", () => {
  it("returns the resources declared on the object itself", () => {
    expect(getResources(schema, "$")).toEqual([
      { objectPath: "$", name: "vehicle", path: "$.vehicle", resource: schema.resources.vehicle },
    ]);
  });

  it("returns nothing for an object without resources or a non-object", () => {
    expect(getResources(object({ a: string() }), "$")).toEqual([]);
    expect(getResources(string(), "$.a")).toEqual([]);
  });
});

describe("findResources", () => {
  it("returns an empty array for a schema without resources", () => {
    expect(findResources(object({ a: string(), b: array(object({ c: string() })) }))).toEqual([]);
    expect(findResources(string())).toEqual([]);
  });

  it("finds resources on the root and nested objects, outer first", () => {
    const owner = resource({ key: ref("name"), outcomes: ["found"] });
    const nested = object({
      plate: string(),
      driver: object({ name: string() }).setResources({ owner }),
    }).setResources({ vehicle: vehicle() });

    expect(findResources(nested)).toEqual([
      { objectPath: "$", name: "vehicle", path: "$.vehicle", resource: nested.resources.vehicle },
      { objectPath: "$.driver", name: "owner", path: "$.driver.owner", resource: owner },
    ]);
  });

  it("addresses resources inside arrays as any item", () => {
    const drivers = object({
      drivers: array(object({ hasCar: boolean(), plate: string() }).setResources({ vehicle: vehicle() })),
    });

    expect(findResources(drivers).map(({ path }) => path)).toEqual(["$.drivers.[].vehicle"]);
  });

  it("visits every member of a discriminated union", () => {
    const union = object({
      kind: discriminatedUnion("type", [
        { type: "car", details: object({ plate: string() }).setResources({ vehicle: vehicle() }) },
        { type: "bike", details: object({ frame: string() }).setResources({ bike: vehicle() }) },
        { type: "none" },
      ]),
    });

    expect(findResources(union).map(({ path }) => path)).toEqual(["$.kind.details.vehicle", "$.kind.details.bike"]);
  });

  it("starts from a given path", () => {
    expect(findResources(schema, "$.inner").map(({ path }) => path)).toEqual(["$.inner.vehicle"]);
  });
});

describe("unpackResourceRef", () => {
  it("resolves the outcome", () => {
    expect(unpack("vehicle.outcome", "$.manualDetails", found)).toBe("found");
  });

  it("resolves the data and nested data", () => {
    expect(unpack("vehicle.data", "$.manualDetails", found)).toEqual({ make: "Volvo", specs: { doors: 5 } });
    expect(unpack("vehicle.data.make", "$.manualDetails", found)).toBe("Volvo");
    expect(unpack("vehicle.data.specs.doors", "$.manualDetails", found)).toBe(5);
  });

  it("resolves from the resource's own path", () => {
    expect(unpack("vehicle.outcome", "$", found)).toBe("found");
  });

  it("walks up from a deeply nested path", () => {
    const resources = { "$.drivers.car": { outcome: "found" } };

    expect(unpack("car.outcome", "$.drivers.foo.bar.lala", resources)).toBe("found");
  });

  it("picks the nearest resource with the name", () => {
    const resources = {
      "$.vehicle": { outcome: "outer" },
      "$.driver.vehicle": { outcome: "inner" },
    };

    expect(unpack("vehicle.outcome", "$.driver.plate", resources)).toBe("inner");
    expect(unpack("vehicle.outcome", "$.plate", resources)).toBe("outer");
  });

  it("resolves each array item against its own resource", () => {
    const resources = {
      "$.drivers.[0].vehicle": { outcome: "found" },
      "$.drivers.[1].vehicle": { outcome: "not_found" },
    };

    expect(unpack("vehicle.outcome", "$.drivers.[0].plate", resources)).toBe("found");
    expect(unpack("vehicle.outcome", "$.drivers.[1].plate", resources)).toBe("not_found");
  });

  it("matches paths regardless of how array items are written", () => {
    const resources = { "$.drivers.[1].vehicle": { outcome: "found" } };

    expect(unpack("vehicle.outcome", "$.drivers.[1].plate", resources)).toBe("found");
    expect(unpack("vehicle.outcome", "$.drivers[1].plate", resources)).toBe("found");
    // the form resolveProperty evaluates `included` predicates with
    expect(unpack("vehicle.outcome", "$.drivers.1.plate", resources)).toBe("found");
    expect(unpack("vehicle.outcome", "$.drivers.1.plate", { "$.drivers[1].vehicle": { outcome: "found" } })).toBe(
      "found"
    );
  });

  it("returns undefined when the resource is not in the context", () => {
    expect(unpack("vehicle.outcome", "$.manualDetails")).toBeUndefined();
    expect(unpack("vehicle.outcome", "$.manualDetails", {})).toBeUndefined();
    expect(unpack("owner.outcome", "$.manualDetails", found)).toBeUndefined();
  });

  it("returns undefined for a part of the resource that does not exist", () => {
    expect(unpack("vehicle.data.color", "$.manualDetails", found)).toBeUndefined();
    expect(unpack("vehicle.data.make", "$.manualDetails", { "$.vehicle": { outcome: "not_found" } })).toBeUndefined();
  });

  it("is used by resolve", () => {
    expect(
      resolve(eq(resourceRef("vehicle.outcome"), "found"), "$.manualDetails", {
        schema,
        values: {},
        resources: found,
      })
    ).toBe(true);
  });
});
