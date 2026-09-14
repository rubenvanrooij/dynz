"use client";

import {
  DynzField,
  type DynzFieldProps,
  IsIncluded,
  useOptions,
} from "@dynz/react-hook-form";
import {
  type ObjectSchema,
  type Schema,
  SchemaType,
} from "dynz";

type FieldProps = {
  name: string;
  label: string;
};

function FieldShell({ name, label, render }: DynzFieldProps & { label: string }) {
  return (
    <DynzField
      name={name}
      render={(props) => {

        const errorMessage = props.fieldState.error?.message

        return (
          <div className={`field ${errorMessage ? " field--invalid" : ""}`}>
            <label htmlFor={name}>
              {label}
              {props.required && <span className="required"> *</span>}
            </label>
            {render(props)}
            {errorMessage && <p className="error">{errorMessage}</p>}
          </div>
        );
      }}
    />
  );
}

function TextField({ name, label }: FieldProps) {
  return (
    <FieldShell
      label={label}
      name={name}
      render={({ field, required, readOnly }) => (
        <input {...field} type="text" aria-required={required} readOnly={readOnly} />
      )}
    />
  );
}

function NumberField({ name, label }: FieldProps) {
  return (
    <FieldShell
      label={label}
      name={name}
      render={({ field, required, readOnly }) => (
        <input {...field} onChange={(e) => field.onChange(Number(e.currentTarget.value))} type="number" aria-required={required} readOnly={readOnly} />
      )}
    />
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
  const options = useOptions(name)

  return (
    <FieldShell
      label={label}
      name={name}
      render={({ field, required, readOnly }) => (
        <select {...field} id={name} value={field.value ?? ""} aria-required={required} disabled={readOnly}>
          <option value="" disabled>
            Choose…
          </option>
          {options.map((option) => (
            <option key={String(option.value)} value={String(option.value)} disabled={!option.enabled}>
              {String(option.value)}
              {option.enabled ? "" : " (unavailable)"}
            </option>
          ))}
        </select>
      )}
    />
  );
}

function CheckboxField({ name, label }: FieldProps) {
  return (
    <FieldShell
      label={label}
      name={name}
      render={({ field, required, readOnly }) => (
        <div className="field">
          <div className="checkbox">
            <input
              id={name}
              type="checkbox"
              checked={field.value === true}
              disabled={readOnly}
              required={required}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.checked)}
            />
          </div>
        </div>
      )}
    />
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
      return <NumberField name={name} label={label}  />;
    case SchemaType.STRING:
      return <TextField name={name} label={label} />;
    default:
      return (
        <p className="note">
          No control for <code>{name}</code> ({fieldSchema.type}) in this example.
        </p>
      );
  }
}
