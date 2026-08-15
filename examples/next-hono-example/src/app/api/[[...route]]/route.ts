import { handle } from "hono/vercel";
import { routes } from "@/server/app";

/**
 * Hono runs *inside* the Next.js server: this catch-all route hands every
 * `/api/**` request to the Hono app, in the same Node process that renders the pages.
 */
export const runtime = "nodejs";

export const GET = handle(routes);
export const POST = handle(routes);
export const PUT = handle(routes);
export const PATCH = handle(routes);
export const DELETE = handle(routes);
export const OPTIONS = handle(routes);
