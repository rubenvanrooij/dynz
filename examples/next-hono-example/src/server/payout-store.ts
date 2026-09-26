import type { SchemaValues } from "dynz";
import type { PayoutSchema } from "./payout-schema";

type PayoutDetails = SchemaValues<PayoutSchema>;

/**
 * Stands in for a database row. What is stored is always the plain document — dynz
 * resolves masked submissions back to these values before anything is persisted.
 */
let stored: PayoutDetails = {
  accountHolder: "Ada Lovelace",
  email: "ada@example.com",
  iban: "NL91ABNA0417164300",
  bsn: "123456782",
};

export const payoutStore = {
  get: (): PayoutDetails => stored,
  set: (next: PayoutDetails) => {
    stored = next;
  },
};
