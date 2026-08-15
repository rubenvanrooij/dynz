import type { ObjectSchema } from "dynz";
import { ExpenseClaimForm } from "@/components/expense-claim-form";
import { serverClient } from "@/lib/server-client";

/**
 * `defaults.employeeId` comes from the session, so the page is per-request rather than
 * prerendered at build time — which also means a schema change is picked up on the next
 * page load rather than the next build.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  // Runs the Hono handler in-process. No HTTP, no loading state, no client-side
  // waterfall — the form arrives already rendered.
  const response = await serverClient.api.forms["expense-claim"].$get();
  const { schema, defaults, policy } = await response.json();

  return (
    <main>
      <h1>Expense claim</h1>
      <p className="lede">
        The schema for this form lives on the server. This page fetches it during the server render and hands it to a
        client component, which renders the fields it finds and validates against them — then the server validates the
        submission against the same schema again. Hono runs inside the Next.js process, and <code>hono/client</code>{" "}
        types every call on both sides.
      </p>

      <nav className="links">
        <a href="/api/docs">Swagger UI</a>
        <a href="/api/openapi.json">openapi.json</a>
        <a href="/api/forms/expense-claim">the schema</a>
      </nav>

      <div className="card">
        {/*
          A dynz schema is plain data, so it crosses the server/client boundary as-is —
          no serialization step, no code shipped, nothing to keep in sync.
        */}
        <ExpenseClaimForm schema={schema as unknown as ObjectSchema<never>} defaults={defaults} policy={policy} />
      </div>
    </main>
  );
}
