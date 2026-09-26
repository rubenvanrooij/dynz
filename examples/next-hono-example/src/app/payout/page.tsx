import type { ObjectSchema } from "dynz";
import { PayoutPanel } from "@/components/payout-form";
import { serverClient } from "@/lib/server-client";

/** Reads the stored record on every request, so a save shows up on the next load. */
export const dynamic = "force-dynamic";

export default async function PayoutPage() {
  const response = await serverClient.api["payout-details"].$get();
  const { schema, values } = await response.json();

  return (
    <main>
      <h1>Payout details</h1>
      <p className="lede">
        The IBAN and BSN are <strong>private fields</strong>. The server masks them before they leave it, so this page
        only ever holds the mask. Leave a field alone and its mask marker goes back, and the server keeps the stored
        value. Type a new value and it is validated in the browser and again on the server.
      </p>

      <nav className="links">
        <a href="/">Expense claim</a>
        <a href="/api/payout-details">what the browser receives</a>
      </nav>

      <div className="card">
        <PayoutPanel schema={schema as unknown as ObjectSchema<never>} initialValues={values} />
      </div>
    </main>
  );
}
