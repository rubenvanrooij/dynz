import type { Predicate } from "../../functions";
import type { Schema } from "../../types";
import { SchemaType as ST } from "../../types";
import type { ObjectSchema } from "./types";

// ============================================================================
// FLUENT BUILDER IMPLEMENTATION
// ============================================================================

/**
 * Internal helper to create a new fluent builder with updated data.
 * Fields are kept as a separate type parameter so that adding a field
 * never produces an intersection with the previous fields record.
 */
function createObjectFluent<
  TBase extends Omit<ObjectSchema<Record<string, Schema>>, "fields">,
  TFields extends Record<string, Schema>,
>(base: TBase, fields: TFields) {
  const data = { ...base, fields };

  const withProps = <P extends Partial<Omit<ObjectSchema<Record<string, Schema>>, "fields">>>(props: P) => {
    return createObjectFluent({ ...base, ...props } as TBase & P, fields);
  };

  return {
    ...data,
    field: <K extends string, S extends Schema>(name: K, schema: S) =>
      createObjectFluent(base, { ...fields, [name]: schema } as TFields & { [P in K]: S }),
    addFields: <T extends Record<string, Schema>>(newFields: T) =>
      createObjectFluent(base, { ...fields, ...newFields } as TFields & T),
    setRequired: (value: boolean | Predicate = true) => withProps({ required: value }),
    optional: () => withProps({ required: false }),
    setMutable: (value: boolean | Predicate = true) => withProps({ mutable: value }),
    setIncluded: (value: boolean | Predicate = true) => withProps({ included: value }),
    setPrivate: (value: boolean = true) => withProps({ private: value }),
  };
}

/**
 * Creates a fluent object schema builder.
 *
 * @example
 * ```typescript
 * const userSchema = obj()
 *   .field('name', str().minLength(v(1)))
 *   .field('email', str().email());
 * ```
 */
export function obj<TFields extends Record<string, Schema> = Record<string, never>>(
  config?: TFields | ({ fields?: TFields } & Partial<Omit<ObjectSchema<TFields>, "type" | "fields">>)
): ReturnType<typeof createObjectFluent<Omit<ObjectSchema<Record<string, Schema>>, "fields">, TFields>> {
  let fields: TFields;
  let rest: Partial<Omit<ObjectSchema<TFields>, "type" | "fields">> = {};

  if (config && "fields" in config && config.fields !== undefined) {
    const { fields: f, ...r } = config as { fields: TFields } & Partial<Omit<ObjectSchema<TFields>, "type" | "fields">>;
    fields = f;
    rest = r;
  } else if (config && !("type" in config)) {
    fields = config as TFields;
  } else {
    fields = {} as TFields;
  }

  return createObjectFluent(
    { type: ST.OBJECT, ...rest } as Omit<ObjectSchema<Record<string, Schema>>, "fields">,
    fields
  );
}
