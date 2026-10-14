import type { ResourceState } from "dynz";
import { latency, RegistryUnavailableError } from "./vehicle-registry";
import type { PaymentOptions } from "./vehicle-schema";

/** A stand-in for the payment provider: the methods it offers per country. */
const METHODS: Record<string, string[]> = {
  NL: ["ideal", "card", "invoice"],
  BE: ["bancontact", "card", "invoice"],
  DE: ["sepa", "invoice"],
};

/** The provider has no answer for this country. */
export const UNREACHABLE_COUNTRY = "FR";

/** @throws {RegistryUnavailableError} when the provider can't answer */
export async function lookupPaymentOptions(country: string): Promise<ResourceState<PaymentOptions, "available">> {
  await latency();

  const methods = METHODS[country];

  if (methods === undefined) {
    throw new RegistryUnavailableError(`The payment provider could not be reached for ${country}`);
  }

  return { outcome: "available", data: { methods } };
}
