import { hc } from "hono/client";
import { type AppType, routes } from "@/server/app";

/**
 * The same typed client as `@/lib/client`, but wired straight into the Hono app's
 * `request()` handler instead of `fetch`.
 *
 * Because Hono runs in this very process, a server component calling the API does not
 * need to make an HTTP request to itself — no socket, no serialization round trip, no
 * absolute URL to configure. The route handlers still run exactly as they would for a
 * browser request, and `hc<AppType>` still checks every call at compile time.
 *
 * Server-only: importing this pulls the Hono app (and the schema) in with it.
 */
export const serverClient = hc<AppType>("http://server", {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(routes.request(input instanceof Request ? input : String(input), init)),
});
