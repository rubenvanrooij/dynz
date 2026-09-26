import { type Schema, SchemaType } from "../types";
import { isArray, isObject } from "../validate/validate-type";
import { isPrivateSchema } from "./is-private";

/** A walked value plus whatever the leaf callback reported along the way. */
export type Walked<M> = { value: unknown; marks: M[] };

export type PrivateLeafFn<M> = (value: unknown, path: string, schema: Schema) => Walked<M>;

const unchanged = <M>(value: unknown): Walked<M> => ({ value, marks: [] });

/**
 * Walks a value alongside its schema and replaces every private leaf with whatever
 * `leaf` returns. Everything else is copied through untouched, including keys the
 * schema does not know about. Paths use the same format as `validate`
 * (`$.tags.[1].name`).
 *
 * Private is only supported on leaf schemas; a private container throws, because
 * masking a whole object leaves nothing to traverse or reference into.
 */
export function walkPrivateLeaves<M>(schema: Schema, value: unknown, path: string, leaf: PrivateLeafFn<M>): Walked<M> {
  const isContainer =
    schema.type === SchemaType.OBJECT ||
    schema.type === SchemaType.ARRAY ||
    schema.type === SchemaType.DISCRIMINATED_UNION ||
    schema.type === SchemaType.EXPRESSION;

  if (isContainer && isPrivateSchema(schema)) {
    throw new Error(`private is only supported on leaf schemas: ${path}`);
  }

  if (schema.type === SchemaType.ARRAY) {
    if (!isArray(value)) {
      return unchanged(value);
    }

    const items = value.map((item, index) => walkPrivateLeaves(schema.schema, item, `${path}.[${index}]`, leaf));

    return { value: items.map((item) => item.value), marks: items.flatMap((item) => item.marks) };
  }

  if (schema.type === SchemaType.OBJECT) {
    if (!isObject(value)) {
      return unchanged(value);
    }

    return walkFields(Object.entries(schema.fields), value, path, leaf);
  }

  if (schema.type === SchemaType.DISCRIMINATED_UNION) {
    if (!isObject(value)) {
      return unchanged(value);
    }

    const member = schema.schemas.find((candidate) => candidate[schema.key] === value[schema.key]);

    if (member === undefined) {
      return unchanged(value);
    }

    const fields = Object.entries(member).filter((entry): entry is [string, Schema] => isObject(entry[1]));

    return walkFields(fields, value, path, leaf);
  }

  return isPrivateSchema(schema) ? leaf(value, path, schema) : unchanged(value);
}

function walkFields<M>(
  fields: [string, Schema][],
  value: Record<string | number, unknown>,
  path: string,
  leaf: PrivateLeafFn<M>
): Walked<M> {
  // Only keys that are present are rewritten, so walking never adds `undefined` keys.
  const walked = fields
    .filter(([key]) => key in value)
    .map(([key, fieldSchema]) => ({ key, ...walkPrivateLeaves(fieldSchema, value[key], `${path}.${key}`, leaf) }));

  return {
    value: { ...value, ...Object.fromEntries(walked.map(({ key, value }) => [key, value])) },
    marks: walked.flatMap(({ marks }) => marks),
  };
}
