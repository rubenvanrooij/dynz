"use client";

import { DynzFormProvider, useDynzForm, useDynzFormContext, usePredicate, useResource } from "@dynz/react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { findSchemaByPath, type ObjectSchema, type ResourceResolver, type ResourceState } from "dynz";
import { type ReactNode, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { client } from "@/lib/client";
import { queryClient } from "@/lib/query-client";
import type { FunnelStep } from "@/server/vehicle-funnel";
import {
  ALL_RISK,
  ALL_RISK_MIN_YEAR,
  type Claims,
  FALLBACK_STATES,
  NOT_DECLINED,
  QUOTE_ONLY,
  type Vehicle,
} from "@/server/vehicle-schema";
import { WidgetField } from "./fields";

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

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="fields">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

type Values = Record<string, unknown>;

const isRecord = (value: unknown): value is Values => typeof value === "object" && value !== null;

const getPath = (values: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((acc, key) => (isRecord(acc) ? acc[key] : undefined), values);

const setPath = (values: Values, path: string, value: unknown): Values => {
  const [head, ...rest] = path.split(".") as [string, ...string[]];

  return {
    ...values,
    [head]: rest.length === 0 ? value : setPath(isRecord(values[head]) ? values[head] : {}, rest.join("."), value),
  };
};

/** A step's own answers into what the funnel has so far; the fields it only reads stay as they were. */
const mergeStep = (values: Values, step: FunnelStep, answers: Values) =>
  step.fields.reduce((acc, { path }) => setPath(acc, path, getPath(answers, path)), values);

const INITIAL_VALUES: Values = {
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
};

/** What this channel shows next to a field, beyond the field itself. */
const AFTER_FIELD: Record<string, ReactNode> = {
  plate: <VehicleCard />,
  "driver.licenceNumber": <ClaimsHint />,
  coverage: <AllRiskHint />,
  paymentMethod: <PaymentHint />,
};

const AFTER_STEP: Record<string, ReactNode> = {
  vehicle: <Eligibility />,
};

function Navigation({ last, pending, onBack }: { last: boolean; pending: boolean; onBack?: () => void }) {
  const notDeclined = usePredicate(NOT_DECLINED);
  const quoteOnly = usePredicate(QUOTE_ONLY);

  return (
    <div className="actions">
      {onBack && (
        <button type="button" className="secondary" onClick={onBack}>
          Back
        </button>
      )}
      {notDeclined && (
        <button type="submit" disabled={pending}>
          {!last ? "Next" : quoteOnly ? "Request a quote" : "Buy"}
        </button>
      )}
    </div>
  );
}

/**
 * One step, one form: its own schema (the step's fields plus what they depend on), started
 * from everything answered so far. The fields it only depends on aren't rendered; their
 * values are the earlier steps' answers, and its resources are looked up again from them
 * (React Query answers from its cache).
 */
function StepForm({
  step,
  number,
  values,
  last,
  pending,
  onBack,
  onNext,
}: {
  step: FunnelStep;
  number: number;
  values: Values;
  last: boolean;
  pending: boolean;
  onBack?: (values: Values) => void;
  onNext: (values: Values) => void;
}) {
  const methods = useDynzForm<ObjectSchema<never>, FieldValues>({
    schema: step.schema,
    defaultValues: values,
    mode: "onBlur",
    reValidateMode: "onChange",
    schemaOptions: SCHEMA_OPTIONS,
  });

  // the raw answers: a field left out by a condition keeps its value for when it comes back,
  // the server strips it anyway
  const answers = () => mergeStep(values, step, methods.getValues());

  return (
    <DynzFormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => onNext(answers()))} noValidate>
        <Step title={`${number}. ${step.title}`}>
          {step.fields.map(({ path, widget }) => (
            <div key={path}>
              <WidgetField
                name={path}
                widget={widget}
                fieldSchema={findSchemaByPath(`$.${path}`, step.schema)}
                itemExtra={(index) => <ClaimsHint path={`$.${path}.[${index}].driverClaims`} />}
              />
              {AFTER_FIELD[path]}
            </div>
          ))}
          {AFTER_STEP[step.id]}
        </Step>
        <Navigation last={last} pending={pending} onBack={onBack && (() => onBack(answers()))} />
      </form>
    </DynzFormProvider>
  );
}

export function VehicleForm({ steps }: { steps: FunnelStep[] }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [index, setIndex] = useState(0);
  const step = steps[index] as FunnelStep;
  const last = index === steps.length - 1;

  // the server checks the collected answers against the full schema and looks every
  // resource up again: the per-step schemas are only for the user
  const application = useMutation({
    mutationFn: async (values: Values) => {
      const response = await client.api["vehicle-registrations"].$post({ json: values });
      return response.json();
    },
    onSuccess: (body) => {
      if (body.status === "invalid") {
        // back to the step that asks the first rejected field
        const path = body.errors[0]?.path.slice(2) ?? "";
        const found = steps.findIndex((s) =>
          s.fields.some((field) => path === field.path || path.startsWith(`${field.path}.`))
        );
        setIndex(found === -1 ? index : found);
      }
    },
  });

  const outcome = application.data;

  return (
    <>
      <p className="note">
        Step {index + 1} of {steps.length}
      </p>

      <StepForm
        key={step.id}
        step={step}
        number={index + 1}
        values={values}
        last={last}
        pending={application.isPending}
        onBack={
          index > 0
            ? (next) => {
                setValues(next);
                setIndex(index - 1);
              }
            : undefined
        }
        onNext={(next) => {
          setValues(next);

          if (last) {
            application.reset();
            application.mutate(next);
          } else {
            setIndex(index + 1);
          }
        }}
      />

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
