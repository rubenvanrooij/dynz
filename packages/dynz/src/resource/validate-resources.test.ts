import { describe, expect, it, vi } from "vitest";
import { eq } from "../functions";
import { ref } from "../reference";
import { array, boolean, expr, object, string } from "../schemas";
import { ErrorCode } from "../types";
import { validate } from "../validate";
import type { ResourceResolver } from "./evaluate-resources";
import { resource, resourceRef } from "./resource";

type Vehicle = { make: string };

const vehicle = resource<Vehicle>({
  key: ref("plate"),
  enabled: eq(ref("hasCar"), true),
  outcomes: ["found", "not_found"],
});

const car = () => ({
  hasCar: boolean(),
  plate: string().optional(),
  manualDetails: object({ make: string() }).setIncluded(eq(resourceRef("vehicle.outcome"), "not_found")),
});

const schema = object(car()).setResources({ vehicle });

const lookup: ResourceResolver = (plate) =>
  plate === "KNOWN" ? { outcome: "found", data: { make: "Volvo" } } : { outcome: "not_found" };

describe("validate with resources", () => {
  it("includes a field based on the outcome of a resource", async () => {
    expect(
      await validate(
        schema,
        undefined,
        { hasCar: true, plate: "UNKNOWN", manualDetails: { make: "Saab" } },
        {
          resolvers: { vehicle: lookup },
        }
      )
    ).toEqual({
      success: true,
      values: { hasCar: true, plate: "UNKNOWN", manualDetails: { make: "Saab" } },
    });

    expect(
      await validate(schema, undefined, { hasCar: true, plate: "UNKNOWN" }, { resolvers: { vehicle: lookup } })
    ).toMatchObject({ success: false, errors: [{ path: "$.manualDetails", code: ErrorCode.REQRUIED }] });
  });

  it("excludes a field based on the outcome of a resource", async () => {
    expect(
      await validate(
        schema,
        undefined,
        { hasCar: true, plate: "KNOWN", manualDetails: { make: "Saab" } },
        {
          resolvers: { vehicle: lookup },
        }
      )
    ).toMatchObject({ success: false, errors: [{ path: "$.manualDetails", code: ErrorCode.INCLUDED }] });

    expect(
      await validate(schema, undefined, { hasCar: true, plate: "KNOWN" }, { resolvers: { vehicle: lookup } })
    ).toMatchObject({ success: true });
  });

  it("does not look up a resource that is not enabled", async () => {
    const resolver = vi.fn(lookup);

    expect(
      await validate(schema, undefined, { hasCar: false, plate: "UNKNOWN" }, { resolvers: { vehicle: resolver } })
    ).toMatchObject({ success: true });
    expect(resolver).not.toHaveBeenCalled();
  });

  it("validates against resource data", async () => {
    const withMake = object({
      hasCar: boolean(),
      plate: string(),
      make: string().equals(resourceRef("vehicle.data.make")),
    }).setResources({ vehicle });

    expect(
      await validate(
        withMake,
        undefined,
        { hasCar: true, plate: "KNOWN", make: "Volvo" },
        {
          resolvers: { vehicle: lookup },
        }
      )
    ).toMatchObject({ success: true });
    expect(
      await validate(
        withMake,
        undefined,
        { hasCar: true, plate: "KNOWN", make: "Saab" },
        {
          resolvers: { vehicle: lookup },
        }
      )
    ).toMatchObject({ success: false, errors: [{ path: "$.make", code: "equals" }] });
  });

  it("resolves every array item against its own resource", async () => {
    const drivers = object({ drivers: array(object(car()).setResources({ vehicle })) });
    const resolver = vi.fn(lookup);

    const result = await validate(
      drivers,
      undefined,
      {
        drivers: [{ hasCar: true, plate: "KNOWN" }, { hasCar: true, plate: "UNKNOWN" }, { hasCar: false }],
      },
      { resolvers: { vehicle: resolver } }
    );

    // only the unknown plate needs manual details; the error path stays document-absolute
    expect(result).toMatchObject({
      success: false,
      errors: [{ path: "$.drivers.[1].manualDetails", code: ErrorCode.REQRUIED }],
    });
    expect(result.success === false && result.errors).toHaveLength(1);
    expect(resolver.mock.calls.map(([key]) => key)).toEqual(["KNOWN", "UNKNOWN"]);
  });

  it("keeps resources when a reference reads a field included by a resource", async () => {
    const copied = object({
      ...car(),
      model: string().setIncluded(eq(resourceRef("vehicle.outcome"), "not_found")),
      copy: expr(ref("model")),
    }).setResources({ vehicle });

    expect(
      await validate(
        copied,
        undefined,
        { hasCar: true, plate: "UNKNOWN", model: "V70", manualDetails: { make: "x" } },
        {
          resolvers: { vehicle: lookup },
        }
      )
    ).toMatchObject({ success: true, values: { model: "V70", copy: "V70" } });
  });

  it("resolves resource references to undefined without resolvers", async () => {
    expect(await validate(schema, undefined, { hasCar: true, plate: "UNKNOWN" })).toMatchObject({ success: true });
  });

  it("rejects when an enabled resource has no resolver", async () => {
    await expect(validate(schema, undefined, { hasCar: true, plate: "UNKNOWN" }, { resolvers: {} })).rejects.toThrow(
      'No resolver for resource "vehicle" at $.vehicle'
    );
  });

  it("rejects when a resolver fails", async () => {
    await expect(
      validate(
        schema,
        undefined,
        { hasCar: true, plate: "UNKNOWN" },
        {
          resolvers: {
            vehicle: async () => {
              throw new Error("lookup failed");
            },
          },
        }
      )
    ).rejects.toThrow("lookup failed");
  });
});
