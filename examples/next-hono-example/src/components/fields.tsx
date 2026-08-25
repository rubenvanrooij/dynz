"use client";

import { IsIncluded, useDynzFormContext, useIsMutable, useIsRequired } from "@dynz/react-hook-form";
import {
  type ObjectSchema,
  type OptionsSchema,
  type Schema,
  SchemaType,
  findSchemaByPath,
  resolvePredicate,
} from "dynz";
import type { ReactNode } from "react";
import { Controller, useWatch } from "react-hook-form";

type FieldProps = {
  name: string;
  label: string;
};

function FieldShell({
  name,
  label,
  error,
  children,
}: FieldProps & { error?: string | undefined; children: ReactNode }) {
  const isRequired = useIsRequired(name);

  return (
    <div className={`field${error ? " field--invalid" : ""}`}>
      <label htmlFor={name}>
        {label}
        {isRequired !== false && <span className="required"> *</span>}
      </label>
      {children}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function TextField({ name, label, type }: FieldProps & { type: "text" | "number" }) {
  const { control } = useDynzFormContext();
  const isMutable = useIsMutable(name);

  return (
    <IsIncluded name={name}>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <FieldShell name={name} label={label} error={fieldState.error?.message}>
            <input
              {...field}
              id={name}
              type={type}
              value={field.value ?? ""}
              step={type === "number" ? "any" : undefined}
              readOnly={isMutable === false}
              onChange={(event) =>
                field.onChange(
                  type === "number"
                    ? event.target.value === ""
                      ? undefined
                      : event.target.valueAsNumber
                    : event.target.value
                )
              }
            />
          </FieldShell>
        )}
      />
    </IsIncluded>
  );
}

/**
 * Options can carry their own `enabled` predicate, so the list of choices is itself
 * conditional. Resolving it needs the live values, hence the `useWatch`.
 *
 * NOTE: read straight from the schema rather than through `useOptions`, which currently
 * builds a malformed path in @dynz/react-hook-form.
 */
function SelectField({ name, label }: FieldProps) {
  const { control, schema } = useDynzFormContext();
  const isMutable = useIsMutable(name);
  const values = useWatch({ control });

  const optionsSchema = findSchemaByPath<OptionsSchema>(`$.${name}`, schema, SchemaType.OPTIONS);

  const choices = optionsSchema.options.map((option) => {
    if (typeof option !== "object") {
      return { value: option, enabled: true };
    }

    return {
      value: option.value,
      enabled:
        typeof option.enabled === "boolean"
          ? option.enabled
          : (resolvePredicate(option.enabled, "$", { schema, values }) ?? false),
    };
  });

  return (
    <IsIncluded name={name}>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <FieldShell name={name} label={label} error={fieldState.error?.message}>
            <select {...field} id={name} value={field.value ?? ""} disabled={isMutable === false}>
              <option value="" disabled>
                Choose…
              </option>
              {choices.map((choice) => (
                <option key={String(choice.value)} value={String(choice.value)} disabled={!choice.enabled}>
                  {String(choice.value)}
                  {choice.enabled ? "" : " (unavailable)"}
                </option>
              ))}
            </select>
          </FieldShell>
        )}
      />
    </IsIncluded>
  );
}

function CheckboxField({ name, label }: FieldProps) {
  const { control } = useDynzFormContext();
  const isMutable = useIsMutable(name);

  return (
    <IsIncluded name={name}>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <div className="field">
            <div className="checkbox">
              <input
                id={name}
                type="checkbox"
                checked={field.value === true}
                disabled={isMutable === false}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(event.target.checked)}
              />
              <label htmlFor={name}>{label}</label>
            </div>
            {fieldState.error && <p className="error">{fieldState.error.message}</p>}
          </div>
        )}
      />
    </IsIncluded>
  );
}

/** A conditionally included subtree renders as a titled group. */
function ObjectField({ name, label, fieldSchema }: FieldProps & { fieldSchema: ObjectSchema<never> }) {
  return (
    <IsIncluded name={name}>
      <fieldset className="group">
        <legend>{label}</legend>
        <div className="fields">
          {Object.entries(fieldSchema.fields).map(([key, childSchema]) => (
            <SchemaField key={key} name={`${name}.${key}`} fieldSchema={childSchema} />
          ))}
        </div>
      </fieldset>
    </IsIncluded>
  );
}

/** `travel.plateNumber` → `Plate number` */
function humanize(name: string): string {
  const leaf = name.split(".").pop() ?? name;
  const spaced = leaf.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Picks a control based on the schema type alone, recursing into nested objects. The
 * browser has never seen this schema before — it arrived over the wire a moment ago.
 */
export function SchemaField({ name, fieldSchema }: { name: string; fieldSchema: Schema }) {
  const label = humanize(name);

  switch (fieldSchema.type) {
    case SchemaType.OBJECT:
      return <ObjectField name={name} label={label} fieldSchema={fieldSchema as ObjectSchema<never>} />;
    case SchemaType.OPTIONS:
    case SchemaType.ENUM:
      return <SelectField name={name} label={label} />;
    case SchemaType.BOOLEAN:
      return <CheckboxField name={name} label={label} />;
    case SchemaType.NUMBER:
      return <TextField name={name} label={label} type="number" />;
    case SchemaType.STRING:
      return <TextField name={name} label={label} type="text" />;
    default:
      return (
        <p className="note">
          No control for <code>{name}</code> ({fieldSchema.type}) in this example.
        </p>
      );
  }
}
