import { type Schema, SchemaType } from "../types";
import { isObject } from "../validate/validate-type";
import { coerceSchema } from "./coerce";
import { discriminantSchema } from "./discriminant-schema";
import { withDefault } from "./with-default";

/**
 * Walks `path` through `schema` and `value` together, returning the schema and the
 * (defaulted, coerced) value found there.
 *
 * Returns `null` when the path can't be reached: the schema doesn't declare it, or it
 * runs through a discriminated union whose active member doesn't lead to it. Callers
 * treat `null` as "not accessible" (not included, a `ref()` resolves to `undefined`).
 * A mistyped path therefore also yields `null` rather than an error.
 */
export function getNested<T extends Schema>(
  path: string,
  schema: T,
  value: unknown
): { schema: Schema; value: unknown } | null {
  const result = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .splice(1)
    .reduce<{ schema: Schema; value: unknown } | null>(
      (acc, cur) => {
        // an earlier segment was already unreachable, so everything below it is too
        if (acc === null) {
          return null;
        }

        if (acc.schema.type === SchemaType.ARRAY) {
          const resolvedValue = withDefault(acc.schema, acc.value);

          if (!Array.isArray(resolvedValue)) {
            throw new Error(`Expected an array at path ${path}, but got ${typeof resolvedValue}`);
          }

          const val = resolvedValue[+cur];

          return {
            value: withDefault(acc.schema.schema, val),
            schema: acc.schema.schema,
          };
        }

        if (acc.schema.type === SchemaType.OBJECT) {
          const resolvedValue = withDefault(acc.schema, acc.value);

          if (resolvedValue !== undefined && resolvedValue !== null && !isObject(resolvedValue)) {
            throw new Error(`Expected an object at path ${path}, but got ${typeof resolvedValue}`);
          }

          const val = resolvedValue === undefined || resolvedValue === null ? undefined : resolvedValue[cur];
          const childSchema = acc.schema.fields[cur];

          // the object doesn't declare this field
          if (childSchema === undefined) {
            return null;
          }

          return {
            value: withDefault(childSchema, val),
            schema: childSchema,
          };
        }

        if (acc.schema.type === SchemaType.DISCRIMINATED_UNION) {
          // A missing union falls back to its own default, the same way OBJECT/ARRAY
          // do above — without this, `ref()` into an absent-but-defaulted union's
          // member would never resolve.
          const resolvedValue = withDefault(acc.schema, acc.value);

          // the discriminator has no schema of its own, so synthesise one listing every
          // member's discriminator value
          if (cur === acc.schema.key) {
            return {
              value: isObject(resolvedValue) ? resolvedValue[acc.schema.key] : undefined,
              schema: discriminantSchema(acc.schema),
            };
          }

          // no union value (and no default), so there is no active member to walk into
          if (resolvedValue === undefined || resolvedValue === null) {
            return null;
          }

          if (!isObject(resolvedValue)) {
            throw new Error(`Expected an object at path ${path}, but got ${typeof resolvedValue}`);
          }
          const { key } = acc.schema;

          const discriminatorValue = resolvedValue[key];
          const matchingMember = acc.schema.schemas.find((s) => s[key] === discriminatorValue);

          // the discriminator value doesn't select any member (e.g. empty or unknown)
          if (matchingMember === undefined) {
            return null;
          }

          const childSchema = matchingMember[cur];

          // the active member doesn't declare this field; another member may, but
          // it isn't reachable under the current values
          if (childSchema === undefined) {
            return null;
          }

          if (typeof childSchema === "string" || typeof childSchema === "number" || typeof childSchema === "boolean") {
            return {
              value: isObject(resolvedValue) ? resolvedValue[acc.schema.key] : undefined,
              schema: acc.schema,
            };
          }

          return {
            value: withDefault(childSchema, resolvedValue[cur]),
            schema: childSchema,
          };
        }

        // a leaf with segments left over, e.g. `holder` declared as a string in the
        // active union member and as an object in another: there is nothing to walk into
        return null;
      },
      { value, schema }
    );

  return result === null
    ? null
    : {
        schema: result.schema,
        value: coerceSchema(result.schema, result.value),
      };
}
