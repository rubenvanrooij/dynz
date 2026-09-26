import { object, string } from "dynz";

/**
 * Payout details: the account holder is ordinary data, but the IBAN and the BSN (Dutch
 * citizen service number) are private. The server never sends them to a browser — only
 * a masked stand-in — and the browser sends that stand-in back when the user leaves the
 * field alone.
 *
 * | Field           | Behaviour                                                        |
 * | --------------- | ---------------------------------------------------------------- |
 * | `iban`          | private, masked by the named `last4` masker (`•••• 4300`)          |
 * | `bsn`           | private with the default mask (`***`), and frozen once stored      |
 *
 * `setPrivate({ mask: "last4" })` only *names* the masker, so the schema stays plain data
 * that can cross the wire. The function itself lives in `payoutMaskers`, on the server.
 */
export const payoutSchema = object({
  accountHolder: string().min(2),
  email: string().email(),
  iban: string().setPrivate({ mask: "last4" }).regex("^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$"),
  bsn: string().setPrivate(true).setMutable(false).regex("^[0-9]{9}$"),
});

export type PayoutSchema = typeof payoutSchema;

/** Server-only: how each named mask is rendered. */
export const payoutMaskers = {
  last4: (value: unknown) => `•••• ${String(value).slice(-4)}`,
};
