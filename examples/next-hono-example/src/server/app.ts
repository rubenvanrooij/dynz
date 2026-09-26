import { swaggerUI } from "@hono/swagger-ui";
import { maskPrivateValues, type SchemaValues, validate } from "dynz";
import { Hono } from "hono";
import {
  APPROVAL_REQUIRED_FROM,
  CLIENT_REFERENCE_REQUIRED_FROM,
  expenseClaimSchema,
  RECEIPT_REQUIRED_FROM,
} from "./expense-claim-schema";
import { buildOpenApiDocument } from "./openapi";
import { payoutMaskers, payoutSchema } from "./payout-schema";
import { payoutStore } from "./payout-store";

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

  /**
   * Private fields, read side: the stored document with every private field masked.
   * The IBAN and BSN never leave the server in plain text.
   */
  .get("/payout-details", (c) =>
    c.json({
      schema: payoutSchema,
      values: maskPrivateValues(payoutSchema, payoutStore.get(), { maskers: payoutMaskers }),
    })
  )

  /**
   * Private fields, write side. Validating against the stored document is what makes
   * masked values work: an untouched field arrives as its mask marker and dynz swaps
   * the stored value back in, so `result.values` is the plain document to persist. An
   * edited field arrives as a plain value and is validated like any other.
   */
  .put("/payout-details", async (c) => {
    const body = await c.req.json();
    const before = payoutStore.get();

    const result = await validate(payoutSchema, before, body);

    if (result.success === false) {
      return c.json(
        {
          ok: false as const,
          // dynz already strips private values from errors; nothing secret is echoed.
          errors: result.errors.map((error) => ({ path: error.path, code: error.code, message: error.message })),
        },
        422
      );
    }

    payoutStore.set(result.values);

    return c.json(
      {
        ok: true as const,
        // Which private fields actually changed — computed server-side, so the browser
        // learns *that* they changed without ever seeing the values.
        changedPrivateFields: (["iban", "bsn"] as const).filter((key) => before[key] !== result.values[key]),
        values: maskPrivateValues(payoutSchema, result.values, { maskers: payoutMaskers }),
      },
      200
    );
  });

export { routes };

/** Consumed by `hc<AppType>` on the client for end-to-end typed requests. */
export type AppType = typeof routes;
