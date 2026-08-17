import { type Schema, SchemaType } from "../types";
import { isObject } from "../validate/validate-type";

/**
 * Cached by schema object, not by value: schemas are built once and reused across
 * many `validate()` calls, so this avoids redoing the recursive Date-repair work
 * every time — it only runs once per schema, ever.
 *
 * Uses a `WeakMap` so entries get garbage-collected automatically once a schema is
 * no longer used, with no manual cleanup needed.
 */
const resolvedDefaults = new WeakMap<Schema, unknown>();

function getResolvedDefault(schema: Schema): unknown {
  if (schema.default === undefined) {
    return undefined;
  }

  if (!resolvedDefaults.has(schema)) {
    resolvedDefaults.set(schema, repairDates(schema, schema.default));
  }

  return resolvedDefaults.get(schema);
}

/**
 * Walks a default value alongside its schema, fixing any `Date` that got turned into
 * a string by serialize()+JSON.parse() — even nested inside objects/arrays.
 *
 * Anything else that looks wrong is left alone; that's a real authoring mistake and
 * should fail validation normally, not get silently coerced. See `withDefault` above.
 */
function repairDates(schema: Schema, value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  if (schema.type === SchemaType.DATE) {
    return typeof value === "string" ? new Date(value) : value;
  }

  if (schema.type === SchemaType.OBJECT && isObject(value)) {
    const repaired: Record<string | number, unknown> = { ...value };

    for (const [key, fieldSchema] of Object.entries(schema.fields)) {
      if (key in value) {
        repaired[key] = repairDates(fieldSchema, value[key]);
      }
    }

    return repaired;
  }

  if (schema.type === SchemaType.ARRAY && Array.isArray(value)) {
    return value.map((item) => repairDates(schema.schema, item));
  }

  if (schema.type === SchemaType.DISCRIMINATED_UNION && isObject(value)) {
    const discriminatorValue = value[schema.key];
    const matchingMember = schema.schemas.find((member) => member[schema.key] === discriminatorValue);

    if (matchingMember === undefined) {
      // Can't tell which member this belongs to — leave it alone, the normal
      // validation path reports the real problem.
      return value;
    }

    const repaired: Record<string | number, unknown> = { ...value };

    for (const [key, memberField] of Object.entries(matchingMember)) {
      if (key === schema.key || typeof memberField !== "object") {
        continue; // the discriminator itself, or a literal sibling value
      }

      if (key in value) {
        repaired[key] = repairDates(memberField, value[key]);
      }
    }

    return repaired;
  }

  return value;
}

/**
 * Returns `value`, or the schema's `default` if `value` is missing
 * (`undefined`/`null`).
 *
 * For object/array/discriminated-union defaults, only the fields the default
 * explicitly sets are substituted — everything else still goes through normal
 * validation, so a nested field's own `.setDefault(...)` still works as expected.
 *
 * Special case: if the default is a `Date` that got turned into a string
 * during serialize/parse, we convert it back to a `Date`. That's the only
 * kind of "repair" we do — a wrong-type default (e.g. a string on a
 * `number()` schema) is a real bug and is left to fail validation normally.
 *
 * Note: this is separate from the `coerce` flag, which only affects
 * user-supplied input, not schema-authored defaults.
 */
export function withDefault(schema: Schema, value: unknown): unknown {
  if (value !== undefined && value !== null) {
    return value;
  }

  return getResolvedDefault(schema) ?? value;
}
