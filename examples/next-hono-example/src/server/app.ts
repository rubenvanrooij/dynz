import { getFunnelPath, getFunnelSchema } from "@dynz/funnel";
import { swaggerUI } from "@hono/swagger-ui";
import { type SchemaValues, validate } from "dynz";
import { Hono } from "hono";
import { DEMO_EMPLOYEE_ID, expenseClaimFunnel } from "./expense-claim-funnel";
import {
  APPROVAL_REQUIRED_FROM,
  CLIENT_REFERENCE_REQUIRED_FROM,
  expenseClaimSchema,
  RECEIPT_REQUIRED_FROM,
} from "./expense-claim-schema";
import { buildOpenApiDocument } from "./openapi";

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

  /**
   * The funnel: the same claim, reshaped into steps. It is plain JSON just like the
   * schema above — including every step's own schema and its branching `next` — so the
   * browser can walk it (`resolveNextStep`, `getFunnelPath`) without another round trip.
   */
  .get("/forms/expense-claim-funnel", (c) => c.json({ funnel: expenseClaimFunnel }))

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
      { employeeId: DEMO_EMPLOYEE_ID } as SchemaValues<typeof expenseClaimSchema>,
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
   * Each step already validated itself in the browser, against its own schema — this
   * is the single revalidation pass that counts, against every step's values at once.
   * `getFunnelSchema` derives an ordinary dynz object schema (`{ [stepId]: step.schema
   * }`) from the funnel, so from here on it is exactly the same `validate()` call as
   * `POST /claims` above.
   */
  .post("/claims/funnel", async (c) => {
    const body = await c.req.json();

    // A skipped branch (no travel details, no approval needed, ...) must not be
    // required just because it's a step in the funnel — only the steps this
    // particular submission actually passed through are.
    const reachedSteps = getFunnelPath(expenseClaimFunnel, body);

    const result = await validate(
      getFunnelSchema(expenseClaimFunnel, reachedSteps),
      { claimBasics: { employeeId: DEMO_EMPLOYEE_ID } } as SchemaValues<ReturnType<typeof getFunnelSchema>>,
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
