"use client";

import { DynzField, type DynzFieldProps, IsIncluded, useDynzFormContext, useOptions } from "@dynz/react-hook-form";
import { type ArraySchema, type ObjectSchema, type Schema, SchemaType } from "dynz";
import type { ReactNode } from "react";
import { get, useFieldArray, useFormState } from "react-hook-form";

type ItemExtra = (index: number) => ReactNode;

type FieldProps = {
  name: string;
  label: string;
};

function FieldShell({ name, label, render }: DynzFieldProps & { label: string }) {
  return (
    <DynzField
      name={name}
      render={(props) => {
        const errorMessage = props.fieldState.error?.message;

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

function DateField({ name, label }: FieldProps) {
  return (
    <FieldShell
      label={label}
      name={name}
      render={({ field, required, readOnly }) => (
        <input {...field} value={field.value ?? ""} type="date" required={required} readOnly={readOnly} />
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
        <input
          {...field}
          onChange={(e) => field.onChange(Number(e.currentTarget.value))}
          type="number"
          aria-required={required}
          readOnly={readOnly}
        />
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
  const options = useOptions(name);

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

/** A blank item for an array of objects: empty text fields, everything else unset. */
function emptyItem(itemSchema: ObjectSchema<never>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(itemSchema.fields).map(([key, field]) => [
      key,
      field.type === SchemaType.STRING ? "" : field.type === SchemaType.OBJECT ? emptyItem(field) : undefined,
    ])
  );
}

/**
 * A list of objects with add and remove buttons. Each item renders its fields like a
 * nested object; the array's own rules (e.g. `max(5)`) show as an error under the list.
 */
function ArrayField({
  name,
  label,
  fieldSchema,
  itemExtra,
}: FieldProps & { fieldSchema: ArraySchema<Schema>; itemExtra?: ItemExtra }) {
  const { control } = useDynzFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as { message?: string; root?: { message?: string } } | undefined;
  const message = error?.message ?? error?.root?.message;
  const itemSchema = fieldSchema.schema;

  if (itemSchema.type !== SchemaType.OBJECT) {
    return (
      <p className="note">
        Only arrays of objects have a control in this example (<code>{name}</code>).
      </p>
    );
  }

  return (
    <IsIncluded name={name}>
      <fieldset className="group">
        <legend>{label}</legend>
        <div className="fields">
          {fields.map((item, index) => (
            <div key={item.id} className="array-item">
              <div className="array-item__header">
                <strong>{index + 1}.</strong>
                <button type="button" className="link" onClick={() => remove(index)}>
                  Remove
                </button>
              </div>
              {Object.entries(itemSchema.fields).map(([key, childSchema]) => (
                <SchemaField key={key} name={`${name}.${index}.${key}`} fieldSchema={childSchema} />
              ))}
              {itemExtra?.(index)}
            </div>
          ))}
          {fields.length === 0 && <p className="lookup">None added.</p>}
          {message && <p className="error">{message}</p>}
          <div>
            <button
              type="button"
              className="secondary"
              onClick={() => append(emptyItem(itemSchema as ObjectSchema<never>))}
            >
              Add
            </button>
          </div>
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
export function SchemaField({
  name,
  fieldSchema,
  itemExtra,
}: {
  name: string;
  fieldSchema: Schema;
  /** For an array: extra content under each item, e.g. a lookup result for that item. */
  itemExtra?: ItemExtra;
}) {
  const label = humanize(name);

  switch (fieldSchema.type) {
    case SchemaType.OBJECT:
      return <ObjectField name={name} label={label} fieldSchema={fieldSchema as ObjectSchema<never>} />;
    case SchemaType.ARRAY:
      return (
        <ArrayField name={name} label={label} fieldSchema={fieldSchema as ArraySchema<Schema>} itemExtra={itemExtra} />
      );
    case SchemaType.OPTIONS:
    case SchemaType.ENUM:
      return <SelectField name={name} label={label} />;
    case SchemaType.BOOLEAN:
      return <CheckboxField name={name} label={label} />;
    case SchemaType.NUMBER:
      return <NumberField name={name} label={label} />;
    case SchemaType.STRING:
      return <TextField name={name} label={label} />;
    case SchemaType.DATE:
      return <DateField name={name} label={label} />;
    // derived on validation, never typed in
    case SchemaType.EXPRESSION:
      return null;
    default:
      return (
        <p className="note">
          No control for <code>{name}</code> ({fieldSchema.type}) in this example.
        </p>
      );
  }
}
