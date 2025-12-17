import type { ResolveContext, Schema, SchemaType, Unpacked, ValueType } from "../types";
import { coerce, coerceSchema, ensureAbsolutePath, getNested } from "../utils";
import { validateShallowType, validateType } from "../validate/validate-type";
import { isReference, type Reference, type ValueOrReference } from "./reference";

export type UnpackedReferenceValue<T extends SchemaType> = T extends SchemaType
  ? {
      schema: Extract<Schema, { type: T }>;
      type: T;
      value: ValueType<T> | undefined;
      static: false;
    }
  : never;

export function unpackRef<V extends ValueOrReference | undefined>(
  valueOrRef: V,
  path: string,
  context: ResolveContext
):
  | { value: ValueType | undefined; static: true }
  | { schema: Schema; type: SchemaType; value: ValueType | undefined; static: false };
export function unpackRef<V extends ValueType | undefined, T extends SchemaType>(
  valueOrRef: V | Reference,
  path: string,
  context: ResolveContext,
  ...expected: T[]
): { value: V; static: true } | UnpackedReferenceValue<T extends Array<never> ? Unpacked<T> : T>;
export function unpackRef<V extends ValueType | undefined, T extends SchemaType>(
  valueOrRef: V | Reference,
  path: string,
  context: ResolveContext,
  ...expected: T[]
): { value: V; static: true } | { schema: Schema; type: SchemaType; value: ValueType | undefined; static: false } {
  if (isReference(valueOrRef)) {
    const { schema, value } = getNested(ensureAbsolutePath(valueOrRef.path, path), context.schema, context.values.new);

    if (expected.length > 0) {
      for (const expect of expected) {
        if (schema.type !== expect) {
          continue;
        }

        const val = coerce(expect, value);

        if (validateShallowType(expect, val)) {
          return {
            schema,
            type: schema.type,
            value: val,
            static: false,
          };
        }
      }
    } else {
      const val = coerceSchema(schema, value);

      if (validateType(schema, val)) {
        return {
          schema,
          type: schema.type,
          value: val,
          static: false,
        };
      }
    }

    return {
      schema,
      type: schema.type,
      value: undefined,
      static: false,
    };
  }

  return { value: valueOrRef, static: true };
}
