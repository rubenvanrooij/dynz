import type { ResourceResolvers, ResourceState } from "dynz";
import { lookupClaims } from "./claims-registry";
import { lookupPaymentOptions } from "./payment-options";
import { lookupVehicle } from "./vehicle-registry";

/** Tries `lookup` twice; when both fail, answers the resource's fallback state instead. */
function withFallback(lookup: (key: string) => Promise<ResourceState>, fallback: ResourceState) {
  return (key: unknown): Promise<ResourceState> =>
    lookup(String(key))
      .catch(() => lookup(String(key)))
      .catch(() => fallback);
}

/**
 * Every lookup, falling back instead of failing. The lookup routes answer with these, and
 * the server validates with them, so the browser and the server always fall back the same way.
 */
export const registries = {
  vehicle: withFallback(lookupVehicle, { outcome: "unverified" }),
  claims: withFallback(lookupClaims, { outcome: "to_verify" }),
  driverClaims: withFallback(lookupClaims, { outcome: "to_verify" }),
  paymentOptions: withFallback(lookupPaymentOptions, { outcome: "fallback" }),
};

export const serverResolvers: ResourceResolvers = registries;
