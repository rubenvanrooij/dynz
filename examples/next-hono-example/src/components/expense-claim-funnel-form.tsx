"use client";

import { type FunnelDefinition, type FunnelValues, resolveNextStep } from "@dynz/funnel";
import { DynzFormProvider, useDynzForm } from "@dynz/react-hook-form";
import { getDefaultValues, type ObjectSchema, type Schema, type SchemaValues } from "dynz";
import { useEffect, useState } from "react";
import { client } from "@/lib/client";
import { SchemaField } from "./fields";

type ServerError = { path: string; code: string; message: string };

type Props = {
  /** Arrived over the wire a moment ago — same story as `ExpenseClaimForm`'s `schema`
   * prop, just one level up: this component knows nothing about the flow beyond "it is
   * a dynz funnel". Every step's own `schema` here is still a `schemaRef` stub — this
   * component fetches the real one, per step, only once it gets there. */
  funnel: FunnelDefinition;
};

export function ExpenseClaimFunnelForm({ funnel }: Props) {
  const [currentStepId, setCurrentStepId] = useState(funnel.initial);
  const [history, setHistory] = useState<string[]>([]);
  const [values, setValues] = useState<FunnelValues>({});
  // Grows one entry at a time as the wizard advances — also what `resolveNextStep`
  // needs to see into a step whose `next` predicate references its own just-submitted
  // fields, since that resolution can't go through dynz's async `resolveSchemaRef`.
  const [resolvedSchemas, setResolvedSchemas] = useState<Record<string, Schema>>({});
  const [stepError, setStepError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState<{ id: string; values: unknown } | undefined>(undefined);
  const [serverErrors, setServerErrors] = useState<ServerError[]>([]);

  const step = funnel.steps.find((s) => s.id === currentStepId);
  const currentSchema = resolvedSchemas[currentStepId];

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch keyed on currentStepId alone — refetching for changes to `accepted`/`resolvedSchemas` itself would loop.
  useEffect(() => {
    if (accepted || currentSchema !== undefined) {
      return;
    }

    let cancelled = false;
    setStepError(undefined);

    client.api.forms["expense-claim-funnel"].steps[":stepId"]
      .$get({ param: { stepId: currentStepId } })
      .then(async (response) => {
        if (response.status !== 200) {
          if (!cancelled) setStepError(`Could not load step "${currentStepId}"`);
          return;
        }
        const body = await response.json();
        if (!cancelled) setResolvedSchemas((prev) => ({ ...prev, [currentStepId]: body.schema as Schema }));
      })
      .catch(() => {
        if (!cancelled) setStepError(`Could not load step "${currentStepId}"`);
      });

    return () => {
      cancelled = true;
    };
  }, [currentStepId, accepted]);

  async function submitFunnel(allValues: FunnelValues) {
    setSubmitting(true);
    setServerErrors([]);

    const response = await client.api.claims.funnel.$post({ json: allValues });

    setSubmitting(false);

    if (response.status === 201) {
      const body = await response.json();
      setAccepted({ id: body.id, values: body.values });
      return;
    }

    const body = await response.json();
    if ("errors" in body) {
      setServerErrors(body.errors);
    }
  }

  function handleStepSubmit(stepId: string, data: unknown) {
    const next = { ...values, [stepId]: data };
    setValues(next);

    const nextStepId = resolveNextStep(funnel, stepId, next, resolvedSchemas);

    if (nextStepId === null) {
      void submitFunnel(next);
      return;
    }

    setHistory((h) => [...h, stepId]);
    setCurrentStepId(nextStepId);
  }

  function handleBack() {
    const previousStepId = history[history.length - 1];
    if (previousStepId === undefined) {
      return;
    }
    setHistory((h) => h.slice(0, -1));
    setCurrentStepId(previousStepId);
  }

  function handleRestart() {
    setValues({});
    setHistory([]);
    setCurrentStepId(funnel.initial);
    setAccepted(undefined);
    setServerErrors([]);
  }

  if (accepted) {
    return (
      <div className="result">
        <h2>Claim {accepted.id} accepted</h2>
        <pre>{JSON.stringify(accepted.values, null, 2)}</pre>
        <div className="actions">
          <button type="button" onClick={handleRestart}>
            Submit another claim
          </button>
        </div>
      </div>
    );
  }

  if (step === undefined) {
    return null;
  }

  if (stepError !== undefined) {
    return <p className="note">{stepError}</p>;
  }

  if (currentSchema === undefined) {
    return <p className="note">Loading step…</p>;
  }

  return (
    <>
      <p className="note">
        Step <strong>{history.length + 1}</strong> — no "of N" here: each step's schema, and whether{" "}
        <strong>travel details</strong> or <strong>approval</strong> show up at all, is only fetched and decided (via{" "}
        <code>resolveNextStep</code>) once you reach it, from a <code>schemaRef</code> the funnel shell only points at.{" "}
        <code>GET /forms/expense-claim-funnel</code> stayed tiny regardless of how many steps this claim has.
      </p>

      <FunnelStepForm
        key={step.id}
        stepId={step.id}
        schema={currentSchema as ObjectSchema<never>}
        initialValues={values[step.id]}
        canGoBack={history.length > 0}
        submitting={submitting}
        onBack={handleBack}
        onSubmitStep={(data) => handleStepSubmit(step.id, data)}
      />

      {serverErrors.length > 0 && (
        <div className="result result--error">
          <h2>Rejected by the server</h2>
          <p>Every step validated in the browser, but the final pass against the whole funnel did not:</p>
          <pre>{JSON.stringify(serverErrors, null, 2)}</pre>
        </div>
      )}
    </>
  );
}

function FunnelStepForm({
  stepId,
  schema,
  initialValues,
  canGoBack,
  submitting,
  onBack,
  onSubmitStep,
}: {
  stepId: string;
  schema: ObjectSchema<never>;
  initialValues: unknown;
  canGoBack: boolean;
  submitting: boolean;
  onBack: () => void;
  onSubmitStep: (data: unknown) => void;
}) {
  const methods = useDynzForm({
    schema,
    defaultValues:
      (initialValues as SchemaValues<typeof schema> | undefined) ??
      // The server owns `employeeId`; prefilling it here is only a convenience — try
      // changing it anyway, `POST /claims/funnel` freezes it regardless.
      (stepId === "claimBasics" ? { ...getDefaultValues(schema), employeeId: "EMP-042" } : getDefaultValues(schema)),
    mode: "onBlur",
    reValidateMode: "onChange",
    schemaOptions: { stripNotIncludedValues: true },
  });

  const onSubmit = methods.handleSubmit((data) => onSubmitStep(data));

  return (
    <DynzFormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate>
        <div className="fields">
          {Object.entries(schema.fields).map(([name, fieldSchema]) => (
            <SchemaField key={name} name={name} fieldSchema={fieldSchema} />
          ))}
        </div>

        <div className="actions">
          {canGoBack && (
            <button type="button" className="secondary" onClick={onBack}>
              Back
            </button>
          )}
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Next"}
          </button>
        </div>
      </form>
    </DynzFormProvider>
  );
}
