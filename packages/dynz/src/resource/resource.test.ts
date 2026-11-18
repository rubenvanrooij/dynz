import { describe, expect, expectTypeOf, it } from "vitest";
import { getConditionDependencies } from "../conditions";
import { eq, resolvePredicate } from "../functions";
import { ref } from "../reference";
import { boolean, object, string } from "../schemas";
import { serialize } from "../serialize";
import { validate } from "../validate";
import {
  isResource,
  isResourceReference,
  RESOURCE_REFERENCE_TYPE,
  RESOURCE_TYPE,
  type Resource,
  resource,
  resourceRef,
  resourceReferencePath,
} from "./resource";

type Vehicle = { make: string; model: string };

const vehicleSchema = () =>
  object({
    hasCar: boolean(),
    plate: string(),
    manualDetails: object({ make: string() }).setIncluded(eq(resourceRef("vehicle.outcome"), "not_found")),
  }).setResources({
    vehicle: resource<Vehicle>({
      key: ref("plate"),
      enabled: eq(ref("hasCar"), true),
      outcomes: ["found", "not_found"],
    }),
  });

describe("resource", () => {
  it("creates a plain resource", () => {
    expect(resource({ key: ref("plate"), enabled: eq(ref("hasCar"), true), outcomes: ["found", "not_found"] })).toEqual(
      {
        type: RESOURCE_TYPE,
        key: ref("plate"),
        enabled: { type: "eq", left: ref("hasCar"), right: { type: "st", value: true } },
        outcomes: ["found", "not_found"],
      }
    );
  });

  it("omits enabled when not given", () => {
    expect(resource({ key: ref("plate"), outcomes: ["found"] })).not.toHaveProperty("enabled");
  });

  it("wraps a literal key in a static value", () => {
    expect(resource({ key: "AB-123-C", outcomes: ["found"] }).key).toEqual({ type: "st", value: "AB-123-C" });
  });

  it("carries the data type and outcomes at type level", () => {
    const vehicle = resource<Vehicle>({ key: ref("plate"), outcomes: ["found", "not_found"] });

    expectTypeOf(vehicle).toExtend<Resource<Vehicle>>();
    expectTypeOf(vehicle.outcomes).toEqualTypeOf<readonly string[]>();
    expectTypeOf(resource({ key: ref("plate"), outcomes: ["found", "not_found"] }).outcomes).toEqualTypeOf<
      readonly ("found" | "not_found")[]
    >();
  });

  it("is recognised by isResource", () => {
    expect(isResource(resource({ key: ref("plate"), outcomes: [] }))).toBe(true);
    expect(isResource(ref("plate"))).toBe(false);
  });
});

describe("resourceReferencePath", () => {
  it("resolves a bare reference from the object declaring the resource", () => {
    expect(resourceReferencePath("plate", "$")).toBe("$.plate");
    expect(resourceReferencePath("plate", "$.driver")).toBe("$.driver.plate");
    expect(resourceReferencePath("car.plate", "$.drivers.[2]")).toBe("$.drivers.[2].car.plate");
  });

  it("resolves a `$` reference from the root", () => {
    expect(resourceReferencePath("$.plate", "$.driver")).toBe("$.plate");
    expect(resourceReferencePath("$", "$.driver")).toBe("$");
  });
});

describe("resourceRef", () => {
  it("creates a resource reference", () => {
    expect(resourceRef("vehicle.outcome")).toEqual({ type: RESOURCE_REFERENCE_TYPE, path: "vehicle.outcome" });
  });

  it("is distinct from a field reference", () => {
    expect(isResourceReference(resourceRef("vehicle.outcome"))).toBe(true);
    expect(isResourceReference(ref("vehicle.outcome"))).toBe(false);
  });
});

describe("setResources", () => {
  it("adds the resources to the object schema", () => {
    const schema = vehicleSchema();

    expect(schema.resources.vehicle).toEqual(
      resource({ key: ref("plate"), enabled: eq(ref("hasCar"), true), outcomes: ["found", "not_found"] })
    );
    expectTypeOf(schema.resources.vehicle).toExtend<Resource<Vehicle>>();
  });

  it("only exists on object schemas", () => {
    // @ts-expect-error setResources is not available on non-object schemas
    expect(string().setResources).toBeUndefined();
  });

  it("serializes to JSON and back", () => {
    const schema = vehicleSchema();

    expect(JSON.parse(serialize(schema))).toMatchObject({
      resources: {
        vehicle: { type: RESOURCE_TYPE, key: ref("plate"), outcomes: ["found", "not_found"] },
      },
      fields: {
        manualDetails: { included: { left: resourceRef("vehicle.outcome") } },
      },
    });
  });
});

describe("before resources are resolved", () => {
  it("treats a resource reference as unavailable", () => {
    const schema = vehicleSchema();

    expect(
      resolvePredicate(eq(resourceRef("vehicle.outcome"), "not_found"), "$.manualDetails", {
        schema,
        values: {},
      })
    ).toBe(false);
  });

  it("does not report a resource reference as a field dependency", () => {
    expect(
      getConditionDependencies(eq(resourceRef("vehicle.outcome"), ref("plate")), "$.manualDetails", vehicleSchema())
    ).toEqual(["$.plate"]);
  });

  it("validates a schema with resources without failing", async () => {
    const result = await validate(vehicleSchema(), undefined, { hasCar: true, plate: "AB-123-C" });

    expect(result).toMatchObject({ success: true });
  });
});
