import type { ResolveContext, Schema, SchemaType, ValueType } from "../types";
import { coerce, coerceSchema, ensureAbsolutePath, getNested } from "../utils";
import { validateShallowType, validateType } from "../validate/validate-type";
import { isReference, type Reference, type ValueOrReference } from "./reference";

export function unpackRef<V extends ValueOrReference>(
  valueOrRef: V,
  path: string,
  context: ResolveContext
): { value: unknown; static: true } | { schema: Schema; value: ValueType | undefined; static: false };
export function unpackRef<V extends ValueType, T extends SchemaType>(
  valueOrRef: V | Reference,
  path: string,
  context: ResolveContext,
  expected: T
): { value: V; static: true } | { schema: Schema; value: ValueType<T> | undefined; static: false };
export function unpackRef<V extends ValueType, T extends SchemaType>(
  valueOrRef: V | Reference,
  path: string,
  context: ResolveContext,
  expected?: T | undefined
): { value: V; static: true } | { schema: Schema; value: ValueType | undefined; static: false } {
  if (isReference(valueOrRef)) {
    const { schema, value } = getNested(ensureAbsolutePath(valueOrRef.path, path), context.schema, context.values.new);

    if (expected) {
      const val = coerce(expected, value);
      if (validateShallowType(expected, val)) {
        return {
          schema,
          value: val,
          static: false,
        };
      }
    } else {
      const val = coerceSchema(schema, value);

      if (validateType(schema, val)) {
        return {
          schema,
          value: val,
          static: false,
        };
      }
    }

    return {
      schema,
      value: undefined,
      static: false,
    };
  }

  return { value: valueOrRef, static: true };
}
