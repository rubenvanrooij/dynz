import type { EnabledResource, ResourceKey, ResourceResolvers, ResourceState } from "dynz";
import { lookupClaims } from "./claims-registry";
import { lookupPaymentOptions } from "./payment-options";
import { lookupVehicle } from "./vehicle-registry";
import { FALLBACK_STATES } from "./vehicle-schema";

/** Tries `lookup` twice; when both fail, answers the resource's fallback state instead. */
function withFallback(
  lookup: (key: string) => Promise<ResourceState>,
  fallback: ResourceState
): (key: ResourceKey, resource: EnabledResource) => Promise<ResourceState> {
  return (key) =>
    lookup(String(key))
      .catch(() => lookup(String(key)))
      .catch(() => fallback);
}

/**
 * How the server looks resources up: straight from the registries, falling back the same
 * way the browser does.
 */
export const serverResolvers: ResourceResolvers = {
  vehicle: withFallback(lookupVehicle, FALLBACK_STATES.vehicle),
  claims: withFallback(lookupClaims, FALLBACK_STATES.claims),
  driverClaims: withFallback(lookupClaims, FALLBACK_STATES.driverClaims),
  paymentOptions: withFallback(lookupPaymentOptions, FALLBACK_STATES.paymentOptions),
};
