"use client";

import { DynzFormProvider, useDynzForm } from "@dynz/react-hook-form";
import type { ObjectSchema, SchemaInput } from "dynz";
import { useState } from "react";
import { client } from "@/lib/client";
import { SchemaField } from "./fields";

type ServerError = { path: string; code: string; message: string };
type Values = SchemaInput<ObjectSchema<never>>;

type Saved = { changedPrivateFields: string[]; sent: unknown };

/**
 * Holds the masked payload the server last sent. After a save the form is remounted
 * against the fresh payload, so "untouched" is always measured against what is stored now.
 */
export function PayoutPanel({ schema, initialValues }: { schema: ObjectSchema<never>; initialValues: unknown }) {
  const [serverValues, setServerValues] = useState(initialValues as Values);
  const [version, setVersion] = useState(0);
  const [saved, setSaved] = useState<Saved | undefined>(undefined);

  return (
    <>
      <PayoutForm
        key={version}
        schema={schema}
        serverValues={serverValues}
        onSaved={(values, result) => {
          setServerValues(values);
          setSaved(result);
          setVersion((v) => v + 1);
        }}
        onSubmitStart={() => setSaved(undefined)}
      />

      {saved && (
        <div className="result">
          <h2>Saved</h2>
          <p>
            Private fields changed on the server:{" "}
            <strong>{saved.changedPrivateFields.length > 0 ? saved.changedPrivateFields.join(", ") : "none"}</strong>
          </p>
          <p>What the browser sent — untouched private fields travel as their mask marker, never as a value:</p>
          <pre>{JSON.stringify(saved.sent, null, 2)}</pre>
        </div>
      )}
    </>
  );
}

type FormProps = {
  schema: ObjectSchema<never>;
  serverValues: Values;
  onSaved: (values: Values, result: Saved) => void;
  onSubmitStart: () => void;
};

function PayoutForm({ schema, serverValues, onSaved, onSubmitStart }: FormProps) {
  const [serverErrors, setServerErrors] = useState<ServerError[]>([]);

  const methods = useDynzForm({
    schema,
    // The masked payload. `useDynzForm` turns each mask into the input's initial text,
    // and the resolver uses it to tell an untouched field (send the marker) from an
    // edited one (validate it, send the value).
    currentValues: serverValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const onSubmit = methods.handleSubmit(async (payload) => {
    onSubmitStart();
    setServerErrors([]);

    const response = await client.api["payout-details"].$put({ json: payload });
    const body = await response.json();

    if (body.ok) {
      onSaved(body.values as Values, { changedPrivateFields: body.changedPrivateFields, sent: payload });
      return;
    }

    setServerErrors(body.errors);

    for (const error of body.errors) {
      methods.setError(error.path.slice(2), { type: error.code, message: error.message });
    }
  });

  return (
    <>
      <p className="note">
        Try it: change only the email and save. The IBAN and BSN go back as mask markers and stay the same on the
        server. Then type a new IBAN; a malformed one is rejected in the browser before anything is sent. The BSN is
        frozen once stored, so changing it is rejected even though the browser never knew the original.
      </p>

      <DynzFormProvider {...methods}>
        <form onSubmit={onSubmit} noValidate>
          <div className="fields">
            {Object.entries(schema.fields).map(([name, fieldSchema]) => (
              <SchemaField key={name} name={name} fieldSchema={fieldSchema} />
            ))}

            <div className="actions">
              <button type="submit" disabled={methods.formState.isSubmitting}>
                Save payout details
              </button>
            </div>
          </div>
        </form>
      </DynzFormProvider>

      {serverErrors.length > 0 && (
        <div className="result result--error">
          <h2>Rejected by the server</h2>
          <pre>{JSON.stringify(serverErrors, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
