import { describe, expect, it, vi } from "vitest";
import { eq, neq, resolve, v } from "../functions";
import { ref } from "../reference";
import { array, boolean, discriminatedUnion, number, object, string } from "../schemas";
import { evaluateResources, getEnabledResources } from "./evaluate-resources";
import { resource, resourceRef } from "./resource";

const vehicle = resource({
  key: ref("plate"),
  enabled: eq(ref("hasCar"), true),
  outcomes: ["found", "not_found"],
});

const schema = object({
  hasCar: boolean(),
  plate: string(),
}).setResources({ vehicle });

const paths = (resources: { path: string }[]) => resources.map(({ path }) => path);

describe("getEnabledResources", () => {
  it("returns an enabled resource with its resolved key", () => {
    expect(getEnabledResources(schema, { hasCar: true, plate: "AB-123-C" })).toEqual([
      { objectPath: "$", name: "vehicle", path: "$.vehicle", resource: vehicle, key: "AB-123-C" },
    ]);
  });

  it("returns nothing for a schema without resources", () => {
    expect(getEnabledResources(object({ a: string() }), { a: "x" })).toEqual([]);
  });

  describe("included", () => {
    it("discards a resource on an object that is not included", () => {
      const nested = object({
        hasDriver: boolean(),
        driver: object({ hasCar: boolean(), plate: string() })
          .setResources({ vehicle })
          .setIncluded(eq(ref("hasDriver"), true)),
      });
      const driver = { hasCar: true, plate: "AB-123-C" };

      expect(paths(getEnabledResources(nested, { hasDriver: true, driver }))).toEqual(["$.driver.vehicle"]);
      expect(getEnabledResources(nested, { hasDriver: false, driver })).toEqual([]);
    });

    it("discards a resource on an ancestor that is not included", () => {
      const nested = object({
        show: boolean(),
        outer: object({
          driver: object({ hasCar: boolean(), plate: string() }).setResources({ vehicle }),
        }).setIncluded(eq(ref("show"), true)),
      });

      expect(getEnabledResources(nested, { show: false, outer: { driver: { hasCar: true, plate: "x" } } })).toEqual([]);
    });

    it("discards a resource on a discriminated union member that is not selected", () => {
      const bike = resource({ key: ref("frame"), outcomes: ["found"] });
      const union = object({
        kind: discriminatedUnion("type", [
          { type: "car", details: object({ hasCar: boolean(), plate: string() }).setResources({ vehicle }) },
          { type: "bike", details: object({ frame: string() }).setResources({ bike }) },
        ]),
      });

      expect(
        getEnabledResources(union, { kind: { type: "car", details: { hasCar: true, plate: "AB-123-C" } } })
      ).toEqual([
        {
          objectPath: "$.kind.details",
          name: "vehicle",
          path: "$.kind.details.vehicle",
          resource: vehicle,
          key: "AB-123-C",
        },
      ]);
      expect(paths(getEnabledResources(union, { kind: { type: "bike", details: { frame: "F1" } } }))).toEqual([
        "$.kind.details.bike",
      ]);
      expect(getEnabledResources(union, { kind: {} })).toEqual([]);
    });
  });

  describe("key", () => {
    it("discards a resource whose key does not resolve", () => {
      expect(getEnabledResources(schema, { hasCar: true })).toEqual([]);
    });

    it("discards a resource whose key is not a primitive", () => {
      const withObjectKey = object({
        hasCar: boolean(),
        owner: object({ name: string() }),
      }).setResources({ vehicle: resource({ key: ref("owner"), outcomes: ["found"] }) });

      expect(getEnabledResources(withObjectKey, { hasCar: true, owner: { name: "x" } })).toEqual([]);
    });

    it("accepts string, number and boolean keys", () => {
      const keyed = (key: Parameters<typeof resource>[0]["key"]) =>
        getEnabledResources(object({ a: string() }).setResources({ r: resource({ key, outcomes: ["found"] }) }), {})[0]
          ?.key;

      expect(keyed("x")).toBe("x");
      expect(keyed(1)).toBe(1);
      expect(keyed(false)).toBe(false);
      expect(keyed(0)).toBe(0);
      expect(keyed(v(new Date(0)))).toBeUndefined();
    });

    it("discards an empty string and a non-finite number", () => {
      const keyed = (value: unknown) =>
        getEnabledResources(
          object({ a: string() }).setResources({ r: resource({ key: ref("a"), outcomes: ["found"] }) }),
          { a: value }
        );

      expect(keyed("")).toEqual([]);
      expect(keyed(Number.NaN)).toEqual([]);
      expect(keyed(Number.POSITIVE_INFINITY)).toEqual([]);
      expect(paths(keyed("x"))).toEqual(["$.r"]);
    });

    it("resolves the key from the declaring object, and `$` from the root", () => {
      const nested = object({
        plate: string(),
        driver: object({ plate: string() }).setResources({
          own: resource({ key: ref("plate"), outcomes: ["found"] }),
          root: resource({ key: ref("$.plate"), outcomes: ["found"] }),
        }),
      });

      const resources = getEnabledResources(nested, { plate: "ROOT", driver: { plate: "DRIVER" } });

      expect(resources.map(({ path, key }) => [path, key])).toEqual([
        ["$.driver.own", "DRIVER"],
        ["$.driver.root", "ROOT"],
      ]);
    });
  });

  describe("enabled", () => {
    it("discards a resource whose enabled predicate is not true", () => {
      expect(getEnabledResources(schema, { hasCar: false, plate: "AB-123-C" })).toEqual([]);
      // unresolvable counts as not enabled
      expect(getEnabledResources(schema, { plate: "AB-123-C" })).toEqual([]);
    });

    it("treats a missing enabled as enabled and respects a static one", () => {
      const statics = object({ plate: string() }).setResources({
        always: resource({ key: ref("plate"), outcomes: ["found"] }),
        on: resource({ key: ref("plate"), enabled: true, outcomes: ["found"] }),
        off: resource({ key: ref("plate"), enabled: false, outcomes: ["found"] }),
      });

      expect(paths(getEnabledResources(statics, { plate: "x" }))).toEqual(["$.always", "$.on"]);
    });
  });

  describe("arrays", () => {
    const drivers = object({
      drivers: array(object({ hasCar: boolean(), plate: string() }).setResources({ vehicle })),
    });

    it("creates one instance per item, evaluated against that item", () => {
      const resources = getEnabledResources(drivers, {
        drivers: [
          { hasCar: true, plate: "A" },
          { hasCar: false, plate: "B" },
          { hasCar: true, plate: "C" },
        ],
      });

      expect(resources.map(({ objectPath, path, key }) => [objectPath, path, key])).toEqual([
        ["$.drivers.[0]", "$.drivers.[0].vehicle", "A"],
        ["$.drivers.[2]", "$.drivers.[2].vehicle", "C"],
      ]);
    });

    it("returns nothing for an empty or missing array", () => {
      expect(getEnabledResources(drivers, { drivers: [] })).toEqual([]);
      expect(getEnabledResources(drivers, {})).toEqual([]);
    });

    it("expands nested arrays", () => {
      const fleets = object({
        fleets: array(
          object({ cars: array(object({ hasCar: boolean(), plate: string() }).setResources({ vehicle })) })
        ),
      });

      const resources = getEnabledResources(fleets, {
        fleets: [{ cars: [{ hasCar: true, plate: "A" }] }, { cars: [] }, { cars: [{}, { hasCar: true, plate: "B" }] }],
      });

      expect(resources.map(({ path, key }) => [path, key])).toEqual([
        ["$.fleets.[0].cars.[0].vehicle", "A"],
        ["$.fleets.[2].cars.[1].vehicle", "B"],
      ]);
    });

    it("uses the number of items, including a default", () => {
      const defaulted = object({
        counts: array(
          object({ n: number() }).setResources({ r: resource({ key: ref("n"), outcomes: ["found"] }) })
        ).setDefault([{ n: 1 }]),
      });

      expect(paths(getEnabledResources(defaulted, {}))).toEqual(["$.counts.[0].r"]);
    });
  });
});

describe("evaluateResources", () => {
  it("looks up enabled resources with the resolver for their name", async () => {
    const lookup = vi.fn(async (plate: unknown) => ({ outcome: "found", data: { plate, make: "Volvo" } }));

    const states = await evaluateResources(schema, { hasCar: true, plate: "AB-123-C" }, { vehicle: lookup });

    expect(states).toEqual({ "$.vehicle": { outcome: "found", data: { plate: "AB-123-C", make: "Volvo" } } });
    expect(lookup).toHaveBeenCalledWith("AB-123-C", {
      objectPath: "$",
      name: "vehicle",
      path: "$.vehicle",
      resource: vehicle,
      key: "AB-123-C",
    });
  });

  it("does not look up resources that are not enabled", async () => {
    const lookup = vi.fn(() => ({ outcome: "found" }));

    expect(await evaluateResources(schema, { hasCar: false, plate: "AB-123-C" }, { vehicle: lookup })).toEqual({});
    expect(lookup).not.toHaveBeenCalled();
  });

  it("accepts synchronous resolvers", async () => {
    expect(
      await evaluateResources(
        schema,
        { hasCar: true, plate: "AB-123-C" },
        { vehicle: () => ({ outcome: "not_found" }) }
      )
    ).toEqual({ "$.vehicle": { outcome: "not_found" } });
  });

  it("looks up every array item separately", async () => {
    const drivers = object({
      drivers: array(object({ hasCar: boolean(), plate: string() }).setResources({ vehicle })),
    });

    const states = await evaluateResources(
      drivers,
      {
        drivers: [
          { hasCar: true, plate: "A" },
          { hasCar: false, plate: "B" },
          { hasCar: true, plate: "C" },
        ],
      },
      { vehicle: (plate) => ({ outcome: plate === "A" ? "found" : "not_found" }) }
    );

    expect(states).toEqual({
      "$.drivers.[0].vehicle": { outcome: "found" },
      "$.drivers.[2].vehicle": { outcome: "not_found" },
    });
  });

  it("produces states that resource references resolve against", async () => {
    const drivers = object({
      drivers: array(
        object({
          hasCar: boolean(),
          plate: string(),
          make: string().setIncluded(eq(resourceRef("vehicle.outcome"), "not_found")),
        }).setResources({ vehicle })
      ),
    });
    const values = {
      drivers: [
        { hasCar: true, plate: "A" },
        { hasCar: true, plate: "B" },
      ],
    };

    const resources = await evaluateResources(drivers, values, {
      vehicle: (plate) => ({ outcome: plate === "A" ? "found" : "not_found" }),
    });
    const makeIncluded = (index: number) =>
      resolve(eq(resourceRef("vehicle.outcome"), "not_found"), `$.drivers.[${index}].make`, {
        schema: drivers,
        values,
        resources,
      });

    expect(makeIncluded(0)).toBe(false);
    expect(makeIncluded(1)).toBe(true);
  });

  it("throws when an enabled resource has no resolver", async () => {
    await expect(evaluateResources(schema, { hasCar: true, plate: "AB-123-C" }, {})).rejects.toThrow(
      'No resolver for resource "vehicle" at $.vehicle'
    );
  });

  it("does not need a resolver for a resource that is not enabled", async () => {
    expect(await evaluateResources(schema, { hasCar: false }, {})).toEqual({});
  });

  it("rejects when a resolver throws", async () => {
    await expect(
      evaluateResources(
        schema,
        { hasCar: true, plate: "AB-123-C" },
        {
          vehicle: async () => {
            throw new Error("lookup failed");
          },
        }
      )
    ).rejects.toThrow("lookup failed");
  });
});

describe("resources that depend on other resources", () => {
  const vehicleByPlate = resource({ key: ref("plate"), outcomes: ["found", "not_found"] });
  const vinCheck = resource({ key: ref("vin"), outcomes: ["ok", "stolen"] });
  const claims = resource({
    key: ref("licence"),
    enabled: neq(resourceRef("vehicle.data.eligibility"), "declined"),
    outcomes: ["found", "not_found"],
  });

  /** The plate is not found, so the VIN is entered manually and checked on its own. */
  const manualVin = object({
    plate: string(),
    manual: object({ vin: string() })
      .setIncluded(eq(resourceRef("vehicle.outcome"), "not_found"))
      .setResources({ vinCheck }),
  }).setResources({ vehicle: vehicleByPlate });
  const manualValues = { plate: "AB-123-C", manual: { vin: "VIN-1" } };

  const withClaims = object({ plate: string(), licence: string() }).setResources({
    vehicle: vehicleByPlate,
    claims,
  });

  describe("getEnabledResources", () => {
    it("evaluates an included that references a resource against the given states", () => {
      expect(paths(getEnabledResources(manualVin, manualValues))).toEqual(["$.vehicle"]);
      expect(paths(getEnabledResources(manualVin, manualValues, { "$.vehicle": { outcome: "not_found" } }))).toEqual([
        "$.vehicle",
        "$.manual.vinCheck",
      ]);
      expect(paths(getEnabledResources(manualVin, manualValues, { "$.vehicle": { outcome: "found" } }))).toEqual([
        "$.vehicle",
      ]);
    });

    it("evaluates an enabled that references a resource against the given states", () => {
      const values = { plate: "AB-123-C", licence: "L-1" };
      const vehicleState = (eligibility: string) => ({
        "$.vehicle": { outcome: "found", data: { eligibility } },
      });

      expect(paths(getEnabledResources(withClaims, values, vehicleState("declined")))).toEqual(["$.vehicle"]);
      expect(paths(getEnabledResources(withClaims, values, vehicleState("accepted")))).toEqual([
        "$.vehicle",
        "$.claims",
      ]);
    });
  });

  describe("evaluateResources", () => {
    it("looks up a resource on an object included by another resource, after that one", async () => {
      const order: string[] = [];
      const states = await evaluateResources(manualVin, manualValues, {
        vehicle: async () => {
          order.push("vehicle");
          return { outcome: "not_found" };
        },
        vinCheck: async (vin) => {
          order.push(`vinCheck:${vin}`);
          return { outcome: "stolen" };
        },
      });

      expect(order).toEqual(["vehicle", "vinCheck:VIN-1"]);
      expect(states).toEqual({
        "$.vehicle": { outcome: "not_found" },
        "$.manual.vinCheck": { outcome: "stolen" },
      });
    });

    it("does not look up a resource whose object stays excluded", async () => {
      const check = vi.fn(() => ({ outcome: "ok" }));

      expect(
        await evaluateResources(manualVin, manualValues, { vehicle: () => ({ outcome: "found" }), vinCheck: check })
      ).toEqual({ "$.vehicle": { outcome: "found" } });
      expect(check).not.toHaveBeenCalled();
    });

    it("drops a resource that was enabled before its dependency settled", async () => {
      // `neq(undefined, "declined")` enables claims in the first round
      const lookupClaims = vi.fn(() => ({ outcome: "found" }));

      const states = await evaluateResources(
        withClaims,
        { plate: "AB-123-C", licence: "L-1" },
        {
          vehicle: () => ({ outcome: "found", data: { eligibility: "declined" } }),
          claims: lookupClaims,
        }
      );

      expect(states).toEqual({ "$.vehicle": { outcome: "found", data: { eligibility: "declined" } } });
    });

    it("terminates on a cycle between resources", async () => {
      const cyclic = object({ a: string(), b: string() }).setResources({
        first: resource({ key: ref("a"), enabled: neq(resourceRef("second.outcome"), "x"), outcomes: ["x"] }),
        second: resource({ key: ref("b"), enabled: neq(resourceRef("first.outcome"), "x"), outcomes: ["x"] }),
      });
      const resolver = vi.fn(() => ({ outcome: "x" }));

      await evaluateResources(cyclic, { a: "1", b: "2" }, { first: resolver, second: resolver });

      expect(resolver.mock.calls.length).toBeLessThanOrEqual(6);
    });
  });
});
