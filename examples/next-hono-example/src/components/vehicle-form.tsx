"use client";

import {
  DynzFormProvider,
  IsIncluded,
  useDynzForm,
  useDynzFormContext,
  usePredicate,
  useResource,
} from "@dynz/react-hook-form";
import { useMutation } from "@tanstack/react-query";
import type { ObjectSchema, ResourceResolver, ResourceState } from "dynz";
import type { ReactNode } from "react";
import type { FieldValues } from "react-hook-form";
import { client } from "@/lib/client";
import { queryClient } from "@/lib/query-client";
import {
  ALL_RISK,
  ALL_RISK_MIN_YEAR,
  type Claims,
  FALLBACK_STATES,
  NOT_DECLINED,
  QUOTE_ONLY,
  type Vehicle,
} from "@/server/vehicle-schema";
import { SchemaField } from "./fields";

const FUNNEL = {
  steps: [{
    id: 'vehicle',
    fields: [{
      path: 'ownership',
      widget: 'dropdown'
    }, {
      path: 'vehicleConfirmed',
      widget: 'checkbox'
    }, {
      path: 'manualVehicle.make',
      widget: 'short_text'
    }, {
      path: 'manualVehicle.model',
      widget: 'short_text'
    }, {
      path: 'manualVehicle.year',
      widget: 'short_text'
    }]
  }, {
    id: 'driver',
    fields: [{
      path: 'driver.name',
      widget: 'short_text'
    },
    {
      path: 'driver.birthDate',
      widget: 'date'
    }]
  }]
}

/**
 * A resolver through React Query: lookups of the same key share one request, a settled key
 * is answered from the cache, and a failed one is retried once. When it still fails, the
 * resource's fallback state is used, the same way the server falls back.
 */
function queryResolver(
  name: keyof typeof FALLBACK_STATES,
  request: (key: string, init: { signal: AbortSignal }) => Promise<{ status: number; json: () => Promise<unknown> }>,
  /** Shares the cache with another resource that looks up the same thing. */
  cache: string = name
): ResourceResolver {
  return (key) =>
    queryClient
      .fetchQuery({
        queryKey: [cache, String(key)],
        queryFn: async ({ signal }) => {
          const response = await request(String(key), { signal });

          if (response.status !== 200) {
            throw new Error(`The ${name} lookup failed`);
          }

          return (await response.json()) as ResourceState;
        },
        retry: 1,
      })
      .catch(() => FALLBACK_STATES[name]);
}

// stable, so the form does not re-subscribe to its values on every render
const SCHEMA_OPTIONS = {
  stripNotIncludedValues: true,
  resolvers: {
    vehicle: queryResolver("vehicle", (plate, init) =>
      client.api.vehicles[":plate"].$get({ param: { plate } }, { init })
    ),
    claims: queryResolver("claims", (licence, init) =>
      client.api.claims[":licence"].$get({ param: { licence } }, { init })
    ),
    driverClaims: queryResolver(
      "driverClaims",
      (licence, init) => client.api.claims[":licence"].$get({ param: { licence } }, { init }),
      "claims"
    ),
    paymentOptions: queryResolver("paymentOptions", (country, init) =>
      client.api["payment-options"][":country"].$get({ param: { country } }, { init })
    ),
  },
};

function Spinner({ children }: { children: ReactNode }) {
  return (
    <p className="lookup">
      <span className="spinner" aria-hidden /> {children}
    </p>
  );
}

/** Step 1: the lookup of the plate, with the found car to confirm. */
function VehicleCard() {
  const vehicle = useResource("$.vehicle");
  const { setValue } = useDynzFormContext();

  if (vehicle?.status === "pending") {
    return <Spinner>Looking up the plate…</Spinner>;
  }

  if (vehicle?.status !== "settled") {
    return null;
  }

  if (vehicle.state.outcome === "unverified") {
    return (
      <p className="lookup lookup--failed">
        The registry could not be reached: enter the car below. It is marked as unverified.
      </p>
    );
  }

  if (vehicle.state.outcome === "not_found") {
    return <p className="lookup">Not in the registry: tell us about the car below.</p>;
  }

  const { make, model, year } = vehicle.state.data as Vehicle;

  return (
    <p className="lookup lookup--found">
      {`${make} ${model} (${year})`}{" "}
      <button type="button" className="link" onClick={() => setValue("plate", "")}>
        This isn't my car
      </button>
    </p>
  );
}

/** Step 1, continued: no input, only the outcome of the eligibility check. */
function Eligibility() {
  const vehicle = useResource("$.vehicle");
  const notDeclined = usePredicate(NOT_DECLINED);
  const quoteOnly = usePredicate(QUOTE_ONLY);

  if (!notDeclined) {
    return (
      <div className="result result--error">
        <h2>We can't insure this car</h2>
        <p>This car is not eligible for insurance with us. There's nothing more to fill in.</p>
      </div>
    );
  }

  if (!quoteOnly) {
    return null;
  }

  return (
    <p className="note">
      {vehicle?.status === "settled" && vehicle.state.outcome === "found"
        ? "This car needs a review by an underwriter: finish the form and we'll send you a quote."
        : "Cars entered by hand are reviewed by an underwriter: finish the form and we'll send you a quote."}
    </p>
  );
}

/**
 * Step 2: the claims history found for a licence number. `path` is the resource instance:
 * the policyholder's, or one per additional driver (`$.additionalDrivers.[0].driverClaims`).
 */
function ClaimsHint({ path = "$.claims" }: { path?: string }) {
  const claims = useResource(path);

  if (claims?.status === "pending") {
    return <Spinner>Looking up your claims history…</Spinner>;
  }

  if (claims?.status !== "settled") {
    return null;
  }

  if (claims.state.outcome === "found") {
    return (
      <p className="lookup lookup--found">Verified: {(claims.state.data as Claims).claimFreeYears} claim-free years.</p>
    );
  }

  return claims.state.outcome === "to_verify" ? (
    <p className="lookup lookup--failed">The claims register could not be reached: we'll verify what you declare.</p>
  ) : (
    <p className="lookup">No claims history found: please declare it yourself.</p>
  );
}

/** Step 3: why all-risk can't be chosen. */
function AllRiskHint() {
  return usePredicate(ALL_RISK) ? null : (
    <p className="lookup">All-risk needs a registered, eligible car from {ALL_RISK_MIN_YEAR} or later.</p>
  );
}

/** Step 4: the payment methods for the driver's country. */
function PaymentHint() {
  const payment = useResource("$.paymentOptions");

  if (payment?.status === "pending") {
    return <Spinner>Loading the payment methods…</Spinner>;
  }

  return payment?.status === "settled" && payment.state.outcome === "fallback" ? (
    <p className="lookup lookup--failed">The payment provider could not be reached: only invoice is available.</p>
  ) : null;
}

function SubmitButton({ pending }: { pending: boolean }) {
  const notDeclined = usePredicate(NOT_DECLINED);
  const quoteOnly = usePredicate(QUOTE_ONLY);

  return notDeclined ? (
    <div className="actions">
      <button type="submit" disabled={pending}>
        {quoteOnly ? "Request a quote" : "Buy"}
      </button>
    </div>
  ) : null;
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="fields">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function VehicleForm({ schema }: { schema: ObjectSchema<never> }) {
  const methods = useDynzForm<ObjectSchema<never>, FieldValues>({
    schema,
    defaultValues: {
      plate: "",
      vehicleConfirmed: false,
      manualVehicle: { make: "", model: "" },
      driver: {
        name: "",
        birthDate: "",
        licenceNumber: "",
        licenceDate: "",
        address: { street: "", postcode: "", city: "" },
        previousInsurer: "",
      },
      additionalDrivers: [],
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    schemaOptions: SCHEMA_OPTIONS,
  });

  // the server looks every resource up again: only the user's input goes over the wire
  const application = useMutation({
    mutationFn: async (values: FieldValues) => {
      const response = await client.api["vehicle-registrations"].$post({ json: values });
      return response.json();
    },
    onSuccess: (body) => {
      if (body.status === "invalid") {
        for (const error of body.errors) {
          methods.setError(error.path.slice(2), { type: error.code, message: error.message });
        }
      }
    },
  });

  const onSubmit = methods.handleSubmit((values) => application.mutateAsync(values));
  const field = (name: string) => <SchemaField name={name} fieldSchema={schema.fields[name]} />;
  const outcome = application.data;

  return (
    <>
      <DynzFormProvider {...methods}>
        <form
          onSubmit={(event) => {
            application.reset();
            void onSubmit(event);
          }}
          noValidate
        >
          <Step title="1. Vehicle">
            {field("ownership")}
            {field("plate")}
            <VehicleCard />
            {field("vehicleConfirmed")}
            {field("manualVehicle")}
            <Eligibility />
          </Step>

          <IsIncluded name="driver">
            <Step title="2. Policyholder">
              {field("driver")}
              <ClaimsHint />
              <SchemaField
                name="additionalDrivers"
                fieldSchema={schema.fields.additionalDrivers}
                itemExtra={(index) => <ClaimsHint path={`$.additionalDrivers.[${index}].driverClaims`} />}
              />
            </Step>
          </IsIncluded>

          <IsIncluded name="coverage">
            <Step title="3. Coverage">
              {field("coverage")}
              <AllRiskHint />
              {field("roadsideAssistance")}
            </Step>
          </IsIncluded>

          <IsIncluded name="paymentMethod">
            <Step title="4. Payment">
              {field("paymentMethod")}
              <PaymentHint />
            </Step>
          </IsIncluded>

          <SubmitButton pending={application.isPending} />
        </form>
      </DynzFormProvider>

      {outcome?.status === "valid" && (
        <div className="result">
          <h2>
            {outcome.kind === "quote" ? "Quote requested" : "Application created"}: {outcome.id}
          </h2>
          <p>The server looked every resource up itself:</p>
          <pre>{JSON.stringify({ values: outcome.values, resources: outcome.resources }, null, 2)}</pre>
        </div>
      )}

      {outcome?.status === "invalid" && (
        <div className="result result--error">
          <h2>Rejected by the server</h2>
          <pre>{JSON.stringify(outcome.errors, null, 2)}</pre>
        </div>
      )}

      {outcome?.status === "declined" && (
        <div className="result result--error">
          <h2>Declined</h2>
          <p>The server found this car is not eligible for insurance.</p>
        </div>
      )}

      {(outcome?.status === "unresolved" || application.isError) && (
        <div className="result result--error">
          <h2>Not decided yet</h2>
          <p>A lookup could not be completed, so the application was neither accepted nor rejected. Try again.</p>
        </div>
      )}
    </>
  );
}
