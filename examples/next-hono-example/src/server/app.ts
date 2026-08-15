import { swaggerUI } from "@hono/swagger-ui";
import { type SchemaValues, validate } from "dynz";
import { Hono } from "hono";
import {
  APPROVAL_REQUIRED_FROM,
  CLIENT_REFERENCE_REQUIRED_FROM,
  RECEIPT_REQUIRED_FROM,
  expenseClaimSchema,
} from "./expense-claim-schema";
import { buildOpenApiDocument } from "./openapi";

/**
 * Stands in for whatever your auth layer provides. The point is that `employeeId` is
 * decided here and marked immutable in the schema, so a client cannot claim on someone
 * else's behalf — the browser hides the field, and the server rejects a changed one.
 */
const session = { employeeId: "EMP-2291" };

const defaults = {
  employeeId: session.employeeId,
  currency: "EUR",
  billable: false,
} as const;

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
      defaults,
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
  });

export { routes };

/** Consumed by `hc<AppType>` on the client for end-to-end typed requests. */
export type AppType = typeof routes;
