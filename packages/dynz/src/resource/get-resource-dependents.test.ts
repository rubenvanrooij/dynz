import { describe, expect, it } from "vitest";
import { eq } from "../functions";
import { ref } from "../reference";
import { array, discriminatedUnion, object, options, string } from "../schemas";
import { getResourceDependents } from "./get-resource-dependents";
import { resource, resourceRef } from "./resource";

const vehicle = resource({ key: ref("plate"), outcomes: ["found", "not_found"] });
const NOT_FOUND = eq(resourceRef("vehicle.outcome"), "not_found");

describe("getResourceDependents", () => {
  it("returns nothing for a schema without resource references", () => {
    expect(getResourceDependents(object({ plate: string() }).setResources({ vehicle }))).toEqual({});
  });

  it("maps a reference in a rule, included and required to its field", () => {
    const schema = object({
      plate: string(),
      make: string().equals(resourceRef("vehicle.data.make")),
      model: string().setIncluded(NOT_FOUND),
      year: string().setRequired(NOT_FOUND),
    }).setResources({ vehicle });

    expect(getResourceDependents(schema)).toEqual({ vehicle: ["$.make", "$.model", "$.year"] });
  });

  it("maps a reference in an option to the options field", () => {
    const schema = object({
      plate: string(),
      coverage: options(["basic", { value: "full", enabled: eq(resourceRef("vehicle.outcome"), "found") }]),
    }).setResources({ vehicle });

    expect(getResourceDependents(schema)).toEqual({ vehicle: ["$.coverage"] });
  });

  it("maps an ancestor's included to the object and everything below it", () => {
    const schema = object({
      plate: string(),
      manual: object({ vin: string(), details: object({ make: string() }) }).setIncluded(NOT_FOUND),
    }).setResources({ vehicle });

    expect(getResourceDependents(schema)).toEqual({
      vehicle: ["$.manual", "$.manual.vin", "$.manual.details", "$.manual.details.make"],
    });
  });

  it("does not pass a rule or required reference on to the children", () => {
    const schema = object({
      plate: string(),
      manual: object({ vin: string() }).setRequired(NOT_FOUND),
    }).setResources({ vehicle });

    expect(getResourceDependents(schema)).toEqual({ vehicle: ["$.manual"] });
  });

  it("writes array items as []", () => {
    const schema = object({
      drivers: array(
        object({
          licence: string(),
          claimFreeYears: string().setIncluded(eq(resourceRef("driverClaims.outcome"), "not_found")),
        }).setResources({ driverClaims: resource({ key: ref("licence"), outcomes: ["found", "not_found"] }) })
      ),
    });

    expect(getResourceDependents(schema)).toEqual({ driverClaims: ["$.drivers.[].claimFreeYears"] });
  });

  it("covers the fields of every discriminated union member", () => {
    const schema = object({
      plate: string(),
      payment: discriminatedUnion("method", [
        { method: "card", number: string().setIncluded(NOT_FOUND) },
        { method: "invoice", reference: string().equals(resourceRef("billing.data.reference")) },
      ]),
    }).setResources({ vehicle });

    expect(getResourceDependents(schema)).toEqual({
      vehicle: ["$.payment.number"],
      billing: ["$.payment.reference"],
    });
  });

  it("lists a path once per resource it reads", () => {
    const schema = object({
      plate: string(),
      manual: object({
        make: string().setIncluded(NOT_FOUND).equals(resourceRef("vehicle.data.make")),
      }).setIncluded(eq(resourceRef("claims.outcome"), "found")),
    }).setResources({ vehicle });

    expect(getResourceDependents(schema)).toEqual({
      claims: ["$.manual", "$.manual.make"],
      vehicle: ["$.manual.make"],
    });
  });
});
