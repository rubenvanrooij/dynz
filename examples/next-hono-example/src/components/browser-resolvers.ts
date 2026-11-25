import type { ResourceResolvers } from "dynz";
import { client } from "@/lib/client";
import { debounced } from "@/lib/debounced";

/**
 * The vehicle schema's resources, as the browser looks them up: straight from the API. The
 * API falls back when a registry is down; when the API itself can't be reached, the browser
 * falls back the same way, so the form never blocks on a lookup.
 */
export const browserResolvers: ResourceResolvers = {
  // typed keys: wait until the user stops typing
  vehicle: debounced(300, (plate, { signal }) =>
    client.api.vehicles[":plate"]
      .$get({ param: { plate: String(plate) } }, { init: { signal } })
      .then((response) => response.json())
      .catch(() => ({ outcome: "unverified" }))
  ),
  claims: debounced(300, (licence, { signal }) =>
    client.api.claims[":licence"]
      .$get({ param: { licence: String(licence) } }, { init: { signal } })
      .then((response) => response.json())
      .catch(() => ({ outcome: "to_verify" }))
  ),
  driverClaims: debounced(300, (licence, { signal }) =>
    client.api.claims[":licence"]
      .$get({ param: { licence: String(licence) } }, { init: { signal } })
      .then((response) => response.json())
      .catch(() => ({ outcome: "to_verify" }))
  ),
  // a chosen country: no need to wait
  paymentOptions: (country, { signal }) =>
    client.api["payment-options"][":country"]
      .$get({ param: { country: String(country) } }, { init: { signal } })
      .then((response) => response.json())
      .catch(() => ({ outcome: "fallback" })),
};
