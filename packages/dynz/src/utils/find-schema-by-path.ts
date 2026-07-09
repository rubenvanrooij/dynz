import type { Predicate } from "../functions";
import { type Discriminator, isDiscriminator } from "../schemas";
import { type Schema, SchemaType } from "../types";
import { isNumber } from "../validate/validate-type";

export const DISCRIMINATOR_KEY_TYPE = "discriminator_key" as const;

/**
 * What `findSchemaByPath` returns when asked for a discriminated union's own discriminator-key
 * path (e.g. "$.union.kind") rather than a member field. There's no single canonical schema for
 * that position — each member has its own (possibly conditionally-enabled) discriminant — so
 * this represents the set of all of them, carrying the parent union's own conditional
 * properties (a `ref()` to this path is really referencing the union's own inclusion state).
 */
export type DiscriminatorKey<TKey extends string = string> = {
  type: typeof DISCRIMINATOR_KEY_TYPE;
  key: TKey;
  /** Every member's discriminator entry, in declaration order. */
  discriminators: Discriminator[];
  included?: boolean | Predicate | undefined;
  required?: boolean | Predicate | undefined;
  mutable?: boolean | Predicate | undefined;
};

export function isDiscriminatorKey(schema: Schema | DiscriminatorKey): schema is DiscriminatorKey {
  return schema.type === DISCRIMINATOR_KEY_TYPE;
}

export type ReturnSchema = Schema | DiscriminatorKey;

export function findSchemaByPath(path: string, schema: Schema): ReturnSchema;
export function findSchemaByPath<T extends Schema = Schema>(path: string, schema: Schema, type: T["type"]): T;
export function findSchemaByPath<T extends Schema = Schema>(
  path: string,
  schema: Schema,
  type?: T["type"]
): ReturnSchema {
  const nestedSchema = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .splice(1)
    .reduce<ReturnSchema>((prev, cur) => {
      if (prev.type === SchemaType.ARRAY) {
        if (!isNumber(+cur)) {
          throw new Error(`Expected an array index at path ${path}, but got ${cur}`);
        }

        return prev.schema;
      }

      if (prev.type === SchemaType.OBJECT) {
        const childSchema = prev.fields[cur];

        if (childSchema === undefined) {
          throw new Error(`No schema found for path ${path}`);
        }

        return childSchema;
      }

      if (prev.type === SchemaType.DISCRIMINATED_UNION) {
        // The discriminator key itself has no single canonical schema across members (each
        // member's discriminator value may differ) — return the set of possible discriminators,
        // carrying the union's own conditional properties.
        if (cur === prev.key) {
          return {
            type: DISCRIMINATOR_KEY_TYPE,
            key: prev.key,
            discriminators: prev.schemas.map((member) => member[prev.key] as Discriminator),
            included: prev.included,
            required: prev.required,
            mutable: prev.mutable,
          };
        }

        for (const member of prev.schemas) {
          const childSchema = member[cur];

          if (childSchema !== undefined) {
            if (isDiscriminator(childSchema)) {
              // Structurally unreachable: cur !== prev.key was already handled above.
              throw new Error(`Unexpected discriminator schema at path ${path}`);
            }

            return childSchema;
          }
        }
        throw new Error(`No schema found for path ${path}`);
      }

      throw new Error(`Cannot find schema at path ${path}`);
    }, schema);

  if (type !== undefined && nestedSchema.type !== type) {
    throw new Error(`Expected schema of type ${type} at path ${path}, but got ${nestedSchema.type}`);
  }

  return nestedSchema;
}
