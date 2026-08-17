import { and, array, boolean, eq, gte, neq, number, object, options, or, ref, string } from "dynz";

/** The expense policy, in one place. Change it and every client follows on next load. */
export const RECEIPT_REQUIRED_FROM = 50;
export const APPROVAL_REQUIRED_FROM = 500;
export const CLIENT_REFERENCE_REQUIRED_FROM = 100;
export const MAX_CLAIM_AMOUNT = 2500;

/**
 * The schema lives on the server, and only on the server.
 *
 * Everything a client needs in order to render *and* validate this form is in here as
 * data — the field types, the rules, and the policy. Change a threshold above and every
 * client picks it up on its next `GET /api/forms/expense-claim`; no frontend deploy.
 *
 * The conditional bits are what make it worth shipping the schema itself rather than
 * the generated JSON Schema:
 *
 * | Field                     | Behaviour                                              |
 * | ------------------------- | ------------------------------------------------------ |
 * | `employeeId`              | frozen — `mutable: false`                                |
 * | `categoryDetails`         | exists only for the "other" category                     |
 * | `travel`                  | a whole nested section, only for travel claims           |
 * | `travel.transport`        | the "flight" option enables itself for international trips |
 * | `travel.kilometers`       | exists only when travelling by car                       |
 * | `travel.plateNumber`      | required only for a company car                          |
 * | `exchangeRate`            | exists only for non-EUR claims                           |
 * | `receiptNumber`           | required from €50 upwards                                |
 * | `approverEmail`           | required for large claims *or* hardware                  |
 * | `clientName`              | exists only for billable claims                          |
 * | `clientReference`         | exists for billable claims over €100                     |
 *
 * The same object is what the server validates against on `POST`, so the browser is
 * never the only thing enforcing any of it.
 */
export const expenseClaimSchema = object({
  /** Filled in by the server and frozen: `mutable: false` makes dynz reject any change. */
  employeeId: string().min(3),
  category: options(["travel", "meals", "hardware", "software", "other"] as const),
  categoryDetails: string()
    .min(3)
    .setIncluded(eq(ref("category"), "other")),

  /**
   * A conditional *section*, not just a conditional field. When `category` is not
   * "travel" the whole subtree disappears — and dynz short-circuits every condition
   * inside it, so `travel.kilometers` resolves to "not included" without the client
   * having to reason about ancestors.
   */
  travel: object({
    from: string().min(2).setDefault("Netherlands"),
    to: string().min(2),
    international: boolean().setDefault(false),
    transport: options([
      "train",
      "company car",
      "own car",
      // Only offered once the trip is marked international.
      { value: "flight", enabled: eq(ref("$.travel.international"), true) },
    ]),
    kilometers: number()
      .min(1)
      .max(4000)
      .setIncluded(or(eq(ref("$.travel.transport"), "own car"), eq(ref("$.travel.transport"), "company car"))),
    plateNumber: string()
      .min(4)
      .setRequired(eq(ref("$.travel.transport"), "company car"))
      .setIncluded(or(eq(ref("$.travel.transport"), "own car"), eq(ref("$.travel.transport"), "company car"))),
  }).setIncluded(eq(ref("category"), "travel")),

  amount: number().min(0.01).max(MAX_CLAIM_AMOUNT),
  currency: options(["EUR", "USD", "GBP"] as const).setDefault("EUR"),
  /** Anything not already in euros needs the rate that was used. */
  exchangeRate: number()
    .min(0.0001)
    .setIncluded(neq(ref("currency"), "EUR")),

  description: string().min(10).max(280),

  receiptNumber: string()
    .min(4)
    .setRequired(gte(ref("amount"), RECEIPT_REQUIRED_FROM)),

  /** Two independent triggers, combined with `or`. */
  approverEmail: string()
    .email()
    .setRequired(or(gte(ref("amount"), APPROVAL_REQUIRED_FROM), eq(ref("category"), "hardware"))),

  billable: boolean().setDefault(false),
  clientName: string()
    .min(2)
    .setIncluded(eq(ref("billable"), true)),
  /** Two conditions that both have to hold, combined with `and`. */
  clientReference: string()
    .min(3)
    .setIncluded(and(eq(ref("billable"), true), gte(ref("amount"), CLIENT_REFERENCE_REQUIRED_FROM))),
});

export type ExpenseClaimSchema = typeof expenseClaimSchema;
