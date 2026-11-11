import { VehicleForm } from "@/components/vehicle-form";
import { serverClient } from "@/lib/server-client";
import type { FunnelStep } from "@/server/vehicle-funnel";

export const dynamic = "force-dynamic";

export default async function VehiclePage() {
  const response = await serverClient.api.forms.vehicle.$get();
  const { steps, knownPlates, unreachablePlate, knownLicences, unreachableLicence, unreachableCountry } =
    await response.json();

  return (
    <main>
      <h1>Car insurance</h1>
      <p className="lede">
        Half of this form depends on things the user can't type: whether the registry knows the plate and whether the
        car is eligible, the driver's claims history, and which payment methods their country offers. The schema
        declares those as <strong>resources</strong>. The browser looks them up as the answers come in; the server
        ignores what the browser concluded and looks them up again.
      </p>

      <nav className="links">
        <a href="/">Expense claim</a>
        <a href="/api/forms/vehicle">the schema</a>
      </nav>

      <div className="card">
        <ul className="note">
          <li>
            Plates:{" "}
            {knownPlates.map((plate) => (
              <code key={plate}>{plate} </code>
            ))}
            (the last one is declined). Any other well-formed plate is not found; <code>{unreachablePlate}</code> makes
            the registry fail.
          </li>
          <li>
            Licences:{" "}
            {knownLicences.map((licence) => (
              <code key={licence}>{licence} </code>
            ))}
            have a claims history; <code>{unreachableLicence}</code> makes the register fail.
          </li>
          <li>
            Country <code>{unreachableCountry}</code> makes the payment provider fail.
          </li>
        </ul>

        <VehicleForm steps={steps as unknown as FunnelStep[]} />
      </div>
    </main>
  );
}
