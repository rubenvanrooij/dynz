import { defineFunnel, step, transition } from "@dynz/funnel";
import {
  boolean,
  eq,
  gte,
  neq,
  number,
  object,
  options,
  or,
  ref,
  type Schema,
  type SchemaRefResolver,
  type SchemaValues,
  schemaRef,
  string,
} from "dynz";
import { APPROVAL_REQUIRED_FROM, MAX_CLAIM_AMOUNT, RECEIPT_REQUIRED_FROM } from "./expense-claim-schema";

/** Stands in for "whoever is logged in" — same role `session.employeeId` plays for the
 * single-schema example, kept local here so this file has no hidden dependencies. */
export const DEMO_EMPLOYEE_ID = "EMP-042";

export const claimBasicsSchema = object({
  /** Filled in by the server and frozen for the rest of the funnel. */
  employeeId: string().min(3).setMutable(false).setDefault("EMP-043"),
  category: options(["travel", "meals", "hardware", "software", "toys", "other"] as const),
  categoryDetails: string()
    .min(3)
    .setIncluded(eq(ref("category"), "other")),
});

/** Only reachable for a travel (or, apparently, toys) claim — the funnel's analogue of
 * the single-schema example's conditionally-included `travel` subtree. */
export const travelDetailsSchema = object({
  from: string().min(2).setDefault("Netherlands"),
  to: string().min(2),
  international: boolean().setDefault(false),
  transport: options([
    "train",
    "company car",
    "own car",
    // Still intra-step: `international` lives in this same step's schema.
    { value: "flight", enabled: eq(ref("international"), true) },
  ]),
  kilometers: number()
    .min(1)
    .max(4000)
    .setIncluded(or(eq(ref("transport"), "own car"), eq(ref("transport"), "company car"))),
  plateNumber: string()
    .min(4)
    .setRequired(eq(ref("transport"), "company car"))
    .setIncluded(or(eq(ref("transport"), "own car"), eq(ref("transport"), "company car"))),
});

export const amountAndReceiptSchema = object({
  amount: number().min(0.01).max(MAX_CLAIM_AMOUNT),
  currency: options(["EUR", "USD", "GBP"] as const).setDefault("EUR"),
  exchangeRate: number()
    .min(0.0001)
    .setIncluded(neq(ref("currency"), "EUR")),
  description: string().min(10).max(280),
  /** Intra-step: `amount` lives right here, so this can stay a field predicate. */
  receiptNumber: string()
    .min(4)
    .setRequired(gte(ref("amount"), RECEIPT_REQUIRED_FROM)),
});

/** Only visited when the policy below says so — inside it, approverEmail is simply
 * required, because reaching this step already *is* the conditional. */
export const approvalSchema = object({ approverEmail: string().email() });

export const billingSchema = object({
  billable: boolean().setDefault(false),
  clientName: string()
    .min(2)
    .setIncluded(eq(ref("billable"), true)),
  /**
   * The single-schema version also requires the claim to be over €100
   * (`CLIENT_REFERENCE_REQUIRED_FROM`) — that check needs `amount`, which lives in
   * `amountAndReceipt`, so a field-level predicate here can't see it. Simplified to
   * "billable" alone; the amount threshold would need to be a `next`/`included`
   * decision at the funnel level, same as `approval` below.
   */
  clientReference: string()
    .min(3)
    .setIncluded(eq(ref("billable"), true)),
});

/**
 * Every step's real schema, keyed by step id. This is the "registry" `schemaRef`
 * refers to below — the thing that, for a real schema registry, would live behind a
 * network call instead of a plain object literal in this same file.
 */
export const expenseClaimSchemasByStepId: Record<string, Schema> = {
  claimBasics: claimBasicsSchema,
  travelDetails: travelDetailsSchema,
  amountAndReceipt: amountAndReceiptSchema,
  approval: approvalSchema,
  billing: billingSchema,
};

const SCHEMA_URI_PREFIX = "schema://expense-claim/";

function expenseClaimSchemaUri(stepId: string): string {
  return `${SCHEMA_URI_PREFIX}${stepId}`;
}

/**
 * The `resolveSchemaRef` dynz's `validate()` needs to follow a `schemaRef(uri)` node
 * back to the real schema. There's no network hop in this demo — the "registry" is
 * `expenseClaimSchemasByStepId` — but the shape is exactly what a client for a real
 * schema registry would expose: an opaque uri in, a `Schema` (or a promise of one) out.
 */
export const resolveExpenseClaimSchemaRef: SchemaRefResolver = (uri) => {
  const stepId = uri.slice(SCHEMA_URI_PREFIX.length);
  const schema = expenseClaimSchemasByStepId[stepId];

  if (schema === undefined) {
    throw new Error(`No schema registered for "${uri}"`);
  }

  return schema;
};

/**
 * The same claim, reshaped as a wizard instead of one long page — one dynz object
 * schema per step, and a `@dynz/funnel` definition wiring them together.
 *
 * Each step's schema is a `schemaRef`, not the schema itself, so
 * `GET /forms/expense-claim-funnel` (see `app.ts`) ships only steps, ids, and the
 * predicates between them — a few hundred bytes no matter how large any one step's
 * form is. A step's actual fields are fetched only once the wizard reaches it, from
 * `GET /forms/expense-claim-funnel/steps/:stepId`, and validated — client-side against
 * that fetched schema directly, server-side via `resolveExpenseClaimSchemaRef` passed
 * to `validate()` — the same way any other dynz schema is.
 *
 * The single-schema example expresses "receipt required from €50" and "approver
 * required from €500 or for hardware" as *field-level* predicates
 * (`.setRequired(gte(ref('amount'), ...))`) because every field shares one schema, so a
 * `ref()` can reach any of them. A step here only sees its own fields — `ref()` inside
 * `travelDetails` cannot see `amountAndReceipt.amount` — so cross-step policy instead
 * lives in a step's `next` (and, where the whole step should be skippable rather than
 * one field, its `included`), resolved against the funnel's own merged schema
 * (`getFunnelSchema`) which *can* see every step. That is the actual trade-off of
 * "independent schema per step": a field only knows its own step; a step's place in the
 * flow can know everything filled in so far.
 */
export const expenseClaimFunnel = defineFunnel({
  initial: "claimBasics",
  steps: [
    step("claimBasics", schemaRef<SchemaValues<typeof claimBasicsSchema>>(expenseClaimSchemaUri("claimBasics")), {
      next: [
        // Cross-step in effect, but resolved here — not inside a field — against the
        // funnel's merged schema, so it can see this step's own just-submitted value.
        transition(
          "travelDetails",
          or(eq(ref("$.claimBasics.category"), "travel"), eq(ref("$.claimBasics.category"), "toys"))
        ),
        transition("amountAndReceipt"),
      ],
    }),

    step("travelDetails", schemaRef<SchemaValues<typeof travelDetailsSchema>>(expenseClaimSchemaUri("travelDetails")), {
      next: [transition("amountAndReceipt")],
    }),

    step(
      "amountAndReceipt",
      schemaRef<SchemaValues<typeof amountAndReceiptSchema>>(expenseClaimSchemaUri("amountAndReceipt")),
      {
        next: [
          // "€500+, or hardware" spans two steps' values — exactly the case a field
          // predicate can't express here. As a step-routing decision it is one line.
          transition(
            "approval",
            or(
              gte(ref("$.amountAndReceipt.amount"), APPROVAL_REQUIRED_FROM),
              eq(ref("$.claimBasics.category"), "hardware")
            )
          ),
          transition("billing"),
        ],
      }
    ),

    step("approval", schemaRef<SchemaValues<typeof approvalSchema>>(expenseClaimSchemaUri("approval")), {
      next: [transition("billing")],
    }),

    step("billing", schemaRef<SchemaValues<typeof billingSchema>>(expenseClaimSchemaUri("billing")), {
      next: [transition(null)],
    }),
  ],
});

export type ExpenseClaimFunnel = typeof expenseClaimFunnel;
