import { swaggerUI } from "@hono/swagger-ui";
import { type EnabledResource, type ResourceKey, type ResourceState, type SchemaValues, validate } from "dynz";
import { type Context, Hono } from "hono";
import { KNOWN_LICENCES, lookupClaims, UNREACHABLE_LICENCE } from "./claims-registry";
import {
  APPROVAL_REQUIRED_FROM,
  CLIENT_REFERENCE_REQUIRED_FROM,
  expenseClaimSchema,
  RECEIPT_REQUIRED_FROM,
} from "./expense-claim-schema";
import { buildOpenApiDocument } from "./openapi";
import { lookupPaymentOptions, UNREACHABLE_COUNTRY } from "./payment-options";
import { serverResolvers } from "./resolvers";
import { KNOWN_PLATES, lookupVehicle, RegistryUnavailableError, UNREACHABLE_PLATE } from "./vehicle-registry";
import { type Vehicle, vehicleSchema } from "./vehicle-schema";

/**
 * Mounted into Next.js at `src/app/api/[[...route]]/route.ts`, so Hono and Next share
 * one Node process — no second server, no proxy, no CORS.
 */
const app = new Hono().basePath("/api");

const routes = app
  /** The schema itself. This is what lets the browser render and pre-validate the form. */
  .get("/forms/expense-claim", (c) =>
    c.json({
      schema: expenseClaimSchema,
      // The thresholds are already inside the schema; these are only here so the page
      // can spell the policy out in prose.
      policy: {
        receiptRequiredFrom: RECEIPT_REQUIRED_FROM,
        approvalRequiredFrom: APPROVAL_REQUIRED_FROM,
        clientReferenceRequiredFrom: CLIENT_REFERENCE_REQUIRED_FROM,
      },
    })
  )

  /** OpenAPI 3.1, with the request body generated from the dynz schema. */
  .get("/openapi.json", (c) => c.json(buildOpenApiDocument()))

  /**
   * Swagger UI over that same document — so the generated JSON Schema is browsable,
   * and `POST /claims` can be exercised straight from the docs page.
   */
  .get("/docs", swaggerUI({ url: "/api/openapi.json" }))

  /**
   * The second validation pass. The client already validated with the same schema, but
   * a client is not a security boundary — this is the one that counts.
   */
  .post("/claims", async (c) => {
    const body = await c.req.json();

    const result = await validate(
      expenseClaimSchema,
      // Only the fields the server owns; every other field has no "current" value, so
      // dynz leaves them mutable.
      { employeeId: session.employeeId } as SchemaValues<typeof expenseClaimSchema>,
      body,
      { stripNotIncludedValues: true }
    );

    if (result.success === false) {
      return c.json(
        {
          ok: false as const,
          errors: result.errors.map((error) => ({
            path: error.path,
            code: error.code,
            message: error.message,
          })),
        },
        422
      );
    }

    return c.json(
      {
        ok: true as const,
        id: `CLM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        values: result.values,
      },
      201
    );
  })

  /** The insurance form. The resources are declared in the schema; how they're looked up is not. */
  .get("/forms/vehicle", (c) =>
    c.json({
      schema: vehicleSchema,
      knownPlates: KNOWN_PLATES,
      unreachablePlate: UNREACHABLE_PLATE,
      knownLicences: KNOWN_LICENCES,
      unreachableLicence: UNREACHABLE_LICENCE,
      unreachableCountry: UNREACHABLE_COUNTRY,
    })
  )

  /** The browser's way into the registries: one lookup each, by key. Failures are a 503. */
  .get("/vehicles/:plate", (c) => lookupOr503(c, () => lookupVehicle(c.req.param("plate"))))
  .get("/claims/:licence", (c) => lookupOr503(c, () => lookupClaims(c.req.param("licence"))))
  .get("/payment-options/:country", (c) => lookupOr503(c, () => lookupPaymentOptions(c.req.param("country"))))

  /**
   * Await mode. The body is only what the user typed: vehicle, claims and payment options
   * are resources, so they never live in the values and a client can't send them. The
   * server looks every enabled one up itself before validating.
   */
  .post("/vehicle-registrations", async (c) => {
    const body = await c.req.json();
    const lookups: Record<string, ResourceState> = {};

    try {
      const result = await validate(vehicleSchema, undefined, body, {
        stripNotIncludedValues: true,
        // the server's own resolvers, recording what they found for the response
        resolvers: Object.fromEntries(
          Object.entries(serverResolvers).map(([name, resolver]) => [
            name,
            async (key: ResourceKey, resource: EnabledResource) => {
              lookups[resource.path] = await resolver(key, resource);
              return lookups[resource.path] as ResourceState;
            },
          ])
        ),
      });

      if (result.success === false) {
        return c.json(
          {
            ok: false as const,
            status: "invalid" as const,
            errors: result.errors.map((error) => ({ path: error.path, code: error.code, message: error.message })),
          },
          422
        );
      }

      const vehicle = lookups["$.vehicle"]?.data as Vehicle | undefined;

      if (vehicle?.eligibility === "declined") {
        return c.json({ ok: false as const, status: "declined" as const }, 422);
      }

      return c.json(
        {
          ok: true as const,
          status: "valid" as const,
          // the derived flag: a manual vehicle or a referral can only get a quote
          kind: result.values.quoteOnly === true ? ("quote" as const) : ("application" as const),
          id: `APP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          values: result.values,
          resources: lookups,
        },
        201
      );
    } catch (error) {
      // The resolvers fall back instead of failing, so this is unexpected: not valid, not
      // invalid, just not decided yet. The client may retry.
      return c.json(
        { ok: false as const, status: "unresolved" as const, message: error instanceof Error ? error.message : "" },
        503
      );
    }
  });

/** Answers a lookup with 200, or 503 when the registry can't be reached. */
async function lookupOr503<T extends ResourceState>(c: Context, lookup: () => Promise<T>) {
  try {
    return c.json(await lookup(), 200);
  } catch (error) {
    if (error instanceof RegistryUnavailableError) {
      return c.json({ error: "registry_unavailable" as const }, 503);
    }
    throw error;
  }
}

export { routes };

/** Consumed by `hc<AppType>` on the client for end-to-end typed requests. */
export type AppType = typeof routes;
