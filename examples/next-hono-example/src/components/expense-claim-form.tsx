"use client";

import { DynzFormProvider, useDynzForm } from "@dynz/react-hook-form";
import { getDefaultValues, type ObjectSchema } from "dynz";
import { useState } from "react";
import { client } from "@/lib/client";
import { SchemaField } from "./fields";

type ServerError = { path: string; code: string; message: string };

export type Policy = {
  receiptRequiredFrom: number;
  approvalRequiredFrom: number;
  clientReferenceRequiredFrom: number;
};

type Props = {
  /**
   * Arrived over the wire a moment ago. The component knows nothing about this form
   * beyond "it is a dynz object schema" — which is the whole point.
   */
  schema: ObjectSchema<never>;
  policy: Policy;
};

export function ExpenseClaimForm({ schema, policy }: Props) {
  const [accepted, setAccepted] = useState<{ id: string; values: unknown } | undefined>(undefined);
  const [serverErrors, setServerErrors] = useState<ServerError[]>([]);

  console.log('default: ', getDefaultValues(schema))

  const methods = useDynzForm({
    schema,
    // The server owns `employeeId`, so hand dynz the current values it must be checked
    // against — that is what turns on mutability enforcement in the browser too.
    defaultValues: getDefaultValues(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    schemaOptions: { stripNotIncludedValues: true },
  });

  // Pass 1 — the browser. `handleSubmit` only calls through once the dynz resolver is happy.
  const onSubmit = methods.handleSubmit(async (values) => {
    setAccepted(undefined);
    setServerErrors([]);

    // Pass 2 — the server, against the very same schema.
    const response = await client.api.claims.$post({ json: values });

    if (response.status === 201) {
      const body = await response.json();
      setAccepted({ id: body.id, values: body.values });
      return;
    }

    const body = await response.json();

    if ("errors" in body) {
      setServerErrors(body.errors);

      // Put each server error back on the field it belongs to. dynz paths are absolute
      // (`$.amount`); react-hook-form wants the bare field name.
      for (const error of body.errors) {
        methods.setError(error.path.slice(2), { type: error.code, message: error.message });
      }
    }
  });

  return (
    <>
      <p className="note">
        Every field below was derived from a schema the server sent at page load — including the conditional bits. Pick{" "}
        <strong>travel</strong> to reveal a whole nested section; mark the trip international to unlock the{" "}
        <strong>flight</strong> option; claim <strong>{policy.receiptRequiredFrom}</strong> or more and a receipt number
        becomes mandatory; <strong>{policy.approvalRequiredFrom}</strong> or more (or any hardware claim) also needs an
        approver; tick <strong>billable</strong> for a client name, and go over{" "}
        <strong>{policy.clientReferenceRequiredFrom}</strong> for a client reference too. None of that is hard-coded in
        this component, and all of it is re-checked on the server.
      </p>

      <DynzFormProvider {...methods}>
        <form onSubmit={onSubmit} noValidate>
          <div className="fields">
            {Object.entries(schema.fields).map(([name, fieldSchema]) => (
              <SchemaField key={name} name={name} fieldSchema={fieldSchema} />
            ))}

            <div className="actions">
              <button type="submit" disabled={methods.formState.isSubmitting}>
                Submit claim
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  methods.reset(getDefaultValues(schema));
                  setAccepted(undefined);
                  setServerErrors([]);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </DynzFormProvider>

      {serverErrors.length > 0 && (
        <div className="result result--error">
          <h2>Rejected by the server</h2>
          <p>The browser let this through, the second pass did not:</p>
          <pre>{JSON.stringify(serverErrors, null, 2)}</pre>
        </div>
      )}

      {accepted && (
        <div className="result">
          <h2>Claim {accepted.id} accepted</h2>
          <pre>{JSON.stringify(accepted.values, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
