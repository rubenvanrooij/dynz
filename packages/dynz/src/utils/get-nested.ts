import { type Discriminator, isDiscriminator } from "../schemas";
import { type Schema, SchemaType } from "../types";
import { isObject } from "../validate/validate-type";
import { coerceSchema } from "./coerce";
import { DISCRIMINATOR_KEY_TYPE, type DiscriminatorKey, isDiscriminatorKey } from "./find-schema-by-path";

export function getNested<T extends Schema>(
  path: string,
  schema: T,
  value: unknown
): { schema: Schema | DiscriminatorKey; value: unknown } | null {
  const result = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .splice(1)
    .reduce<{ schema: Schema | DiscriminatorKey; value: unknown } | null>(
      (acc, cur) => {
        if (acc === null) {
          return null;
        }

        if (acc.schema.type === SchemaType.ARRAY) {
          if (!Array.isArray(acc.value)) {
            throw new Error(`Expected an array at path ${path}, but got ${typeof acc.value}`);
          }

          const index = +cur;
          const val = acc.value[index];

          return {
            value: val === undefined ? acc.schema.default : val,
            schema: acc.schema.schema,
          };
        }

        if (acc.schema.type === SchemaType.OBJECT) {
          if (acc.value !== undefined && acc.value !== null && !isObject(acc.value)) {
            throw new Error(`Expected an object at path ${path}, but got ${typeof acc.value}`);
          }

          const val = acc.value === undefined || acc.value === null ? undefined : acc.value[cur];
          const childSchema = acc.schema.fields[cur];

          if (childSchema === undefined) {
            throw new Error(`No schema found for path ${path}`);
          }

          return {
            value: val === undefined ? acc.schema.fields[cur]?.default : val,
            schema: childSchema,
          };
        }

        if (acc.schema.type === SchemaType.DISCRIMINATED_UNION) {
          // The discriminator key itself has no single canonical schema across members — return
          // a DiscriminatorKey (same shape findSchemaByPath produces), paired with the raw
          // discriminator value actually present.
          const { schema, value } = acc;

          if (cur === schema.key) {
            return {
              value: isObject(acc.value) ? acc.value[schema.key] : undefined,
              schema: {
                type: DISCRIMINATOR_KEY_TYPE,
                key: schema.key,
                schemas: schema.schemas,
                discriminators: schema.schemas.map((member) => member[schema.key] as Discriminator),
                included: schema.included,
                required: schema.required,
                mutable: schema.mutable,
              },
            };
          }

          /**
           * If value is undefined or null we cannot determine
           * which schema to use for the given union; returning null in that case
           */
          if (value === undefined || value === null) {
            return null;
          }

          if (!isObject(value)) {
            throw new Error(`Expected an object at path ${path}, but got ${typeof value}`);
          }

          const { key } = schema;
          const discriminatorValue = value[key];
          const matchingMember = schema.schemas.find((s) => {
            const discriminator = s[key];
            return isDiscriminator(discriminator) && discriminator.value === discriminatorValue;
          });

          if (matchingMember === undefined) {
            return null;
          }

          const childSchema = matchingMember[cur];

          if (childSchema === undefined) {
            return null;
          }

          if (isDiscriminator(childSchema)) {
            // Structurally unreachable: cur !== key was already handled above, and only the
            // discriminator key's entry is ever a Discriminator.
            throw new Error(`Unexpected discriminator schema at path ${path}`);
          }

          return {
            value: value[cur],
            schema: childSchema,
          };
        }

        throw new Error("Cannot get nested value on non array or non object");
      },
      { value, schema }
    );

  if (result === null) {
    return null;
  }

  return isDiscriminatorKey(result.schema)
    ? { schema: result.schema, value: result.value }
    : { schema: result.schema, value: coerceSchema(result.schema, result.value) };
}
