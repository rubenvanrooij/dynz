import type { ResolveContext, Schema } from "../types";
import { coerce, ensureAbsolutePath, getNested } from "../utils";
import { validateType } from "../validate";
import { isReference, type ValueOrReference } from "./reference";

export function unpackRefValue<T extends ValueOrReference>(
  valueOrRef: T,
  path: string,
  context: ResolveContext
): unknown {
  return unpackRef(valueOrRef, path, context).value;
}

export function unpackRef<T extends ValueOrReference>(
  valueOrRef: T,
  path: string,
  context: ResolveContext
): { value: unknown; static: true } | { schema: Schema; value: unknown; static: false } {
  if (isReference(valueOrRef)) {
    const { schema, value } = getNested(ensureAbsolutePath(valueOrRef.path, path), context.schema, context.values.new);

    const val = coerce(schema, value);

    // If the referenced value is not in the correct type return undefined as the value
    if (!validateType(schema.type, val)) {
      return {
        schema,
        value: undefined,
        static: false,
      };
    }

    return {
      schema,
      value: coerce(schema, value),
      static: false,
    };
  }

  return { value: valueOrRef, static: true };
}
