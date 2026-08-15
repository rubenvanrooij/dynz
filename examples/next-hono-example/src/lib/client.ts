import { hc } from "hono/client";
import type { AppType } from "@/server/app";

/**
 * One typed client for the whole API. Because `AppType` is inferred from the Hono
 * routes, the request bodies, the response bodies *and* the status-code unions are
 * checked at compile time — rename a route or change a payload on the server and this
 * file's callers stop compiling.
 *
 * Same process, so a relative base URL is all it takes in the browser.
 */
export const client = hc<AppType>(typeof window === "undefined" ? "http://localhost:3000" : window.location.origin);
