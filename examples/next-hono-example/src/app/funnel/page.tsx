import type { FunnelDefinition } from "@dynz/funnel";
import { ExpenseClaimFunnelForm } from "@/components/expense-claim-funnel-form";
import { serverClient } from "@/lib/server-client";

export const dynamic = "force-dynamic";

export default async function FunnelPage() {
  const response = await serverClient.api.forms["expense-claim-funnel"].$get();
  const { funnel } = await response.json();

  return (
    <main>
      <h1>Expense claim, as a funnel</h1>
      <p className="lede">
        The same expense claim as <a href="/">the single-page form</a>, reshaped into steps with{" "}
        <code>@dynz/funnel</code>. The funnel — every step&apos;s schema and the predicates that pick the next one — is
        served as plain JSON, exactly like the single schema is, and walked entirely in the browser from that one
        response.
      </p>

      <nav className="links">
        <a href="/">single-page form</a>
        <a href="/api/forms/expense-claim-funnel">the funnel</a>
        <a href="/api/docs">Swagger UI</a>
      </nav>

      <div className="card">
        {/* Plain data crossing the server/client boundary as-is, same as the schema does. */}
        <ExpenseClaimFunnelForm funnel={funnel as unknown as FunnelDefinition} />
      </div>
    </main>
  );
}
