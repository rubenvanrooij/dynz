import { toStandardJsonSchema } from "@dynz/to-json-schema";
import { RECEIPT_REQUIRED_FROM, expenseClaimSchema } from "./expense-claim-schema";

/**
 * The OpenAPI document is *generated from the dynz schema*, not maintained alongside
 * it. `toStandardJsonSchema` turns the schema into JSON Schema 2020-12, which is
 * exactly the dialect OpenAPI 3.1 embeds — so the request body of `POST /claims` can
 * never drift from what the server actually validates.
 *
 * Conditional properties (`included` / `required` predicates) have no JSON Schema
 * equivalent, so the conversion drops them with a warning. That is the whole reason
 * the browser fetches the dynz schema itself rather than this document: JSON Schema
 * describes the shape, dynz describes the behaviour.
 */
export function buildOpenApiDocument(): Record<string, unknown> {
  const claimSchema = toStandardJsonSchema(expenseClaimSchema, { errorMode: "ignore" });

  return {
    openapi: "3.1.0",
    info: {
      title: "Expense claims",
      version: "1.0.0",
      description:
        "The dynz schema is the single source of truth. `GET /forms/expense-claim` serves it " +
        "so clients can render and pre-validate the form; `POST /claims` re-validates every " +
        "submission against the very same schema.",
    },
    servers: [{ url: "/api" }],
    paths: {
      "/forms/expense-claim": {
        get: {
          operationId: "getExpenseClaimForm",
          summary: "The dynz schema for the expense-claim form",
          description:
            "Returns the schema as data, together with the server-provided defaults. Clients " +
            "render the form and run client-side validation from this alone.",
          responses: {
            "200": {
              description: "The form definition",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["schema", "defaults"],
                    properties: {
                      schema: { type: "object", description: "A serialized dynz schema" },
                      defaults: { $ref: "#/components/schemas/ExpenseClaim" },
                      policy: {
                        type: "object",
                        properties: { receiptRequiredFrom: { type: "number" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/claims": {
        post: {
          operationId: "createClaim",
          summary: "Submit an expense claim",
          description: `Re-validates the payload against the same dynz schema. Receipts are mandatory from ${RECEIPT_REQUIRED_FROM} upwards.`,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                // Generated straight from the dynz schema.
                schema: { $ref: "#/components/schemas/ExpenseClaim" },
              },
            },
          },
          responses: {
            "201": {
              description: "The claim was accepted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "id", "values"],
                    properties: {
                      ok: { const: true },
                      id: { type: "string" },
                      values: { $ref: "#/components/schemas/ExpenseClaim" },
                    },
                  },
                },
              },
            },
            "422": {
              description: "The claim failed server-side validation",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationFailure" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        ExpenseClaim: claimSchema,
        ValidationFailure: {
          type: "object",
          required: ["ok", "errors"],
          properties: {
            ok: { const: false },
            errors: {
              type: "array",
              items: {
                type: "object",
                required: ["path", "code", "message"],
                properties: {
                  path: { type: "string", description: 'dynz path, e.g. "$.amount"' },
                  code: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  };
}
