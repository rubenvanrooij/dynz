import type { Reference } from "../reference";
import type { ResolveContext, Schema, SchemaType, ValueType } from "../types";
import { coerce, coerceSchema, ensureAbsolutePath, getNested } from "../utils";
import { validateShallowType, validateType } from "../validate/validate-type";
import type { Predicate } from "./predicate-types";
import { PREDICATES } from "./predicates";
import type { Transformer } from "./transformer-types";
import { TRANSFORMERS } from "./transformers";
import type { ParamaterValue } from "./types";

export function unpackRef<T extends SchemaType = SchemaType>(
  ref: Reference,
  path: string,
  context: ResolveContext,
  ...expected: T[]
): ValueType<T> | undefined {
  const { schema, value } = getNested(ensureAbsolutePath(ref.path, path), context.schema, context.values);

  if (expected.length > 0) {
    for (const expect of expected) {
      if (schema.type !== expect) {
        continue;
      }

      const val = coerce(expect, value);

      if (validateShallowType(expect, val)) {
        return val;
      }
    }
  } else {
    const val = coerceSchema(schema, value);

    if (validateType(schema, val, path, context)) {
      // TODO: fix with function overloading
      return val as ValueType<T>;
    }
  }

  return undefined;
}

export function resolveExpected<T extends SchemaType = SchemaType>(
  input: ParamaterValue,
  path: string,
  context: ResolveContext,
  ...expected: T[]
): ValueType<T> | undefined {
  const value = resolve(input, path, context);

  if (expected.length > 0) {
    for (const expect of expected) {
      const val = coerce(expect, value);

      if (validateShallowType(expect, val)) {
        return val;
      }
    }

    return undefined;
  }

  return value as ValueType<T> | undefined;
}

export function resolve<TParam extends ParamaterValue, TPath extends string, TSchema extends Schema, TValue>(
  input: TParam,
  path: TPath,
  context: ResolveContext<TSchema, TValue>
): ValueType | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (input.type === "_dref") {
    return unpackRef(input, path, context);
  }

  if (input.type === "st") {
    return input.value;
  }

  return resolveFunction(input, path, context);
}

export function resolvePredicate(input: Predicate, path: string, context: ResolveContext): boolean | undefined {
  const result = resolveFunction(input, path, context);

  if (typeof result === "boolean") {
    return result;
  }

  return undefined;
}

const FUNCTIONS = {
  ...TRANSFORMERS,
  ...PREDICATES,
} as const;

export function resolveFunction(
  input: Predicate | Transformer,
  path: string,
  context: ResolveContext
): ValueType | undefined {
  switch (input.type) {
    case "or":
    case "and":
      return FUNCTIONS[input.type](input.predicates.map((predicate) => resolvePredicate(predicate, path, context)));
    // left <> right predicates
    case "eq":
    case "neq":
    case "in":
    case "nin":
    case "gt":
    case "gte":
    case "lt":
    case "lte":
      return FUNCTIONS[input.type](resolve(input.left, path, context), resolve(input.right, path, context));
    case "matches":
      return FUNCTIONS[input.type](
        resolve(input.left, path, context),
        resolve(input.right, path, context),
        input.flags
      );
    case "custom":
      throw new Error("not yet implemented");
    // expects array of input values
    case "sum":
    case "sub":
    case "divide":
    case "multiply":
      return FUNCTIONS[input.type](input.value.map((val) => resolve(val, path, context)));
    // expects single input value
    default:
      return FUNCTIONS[input.type](resolve(input.value, path, context));
  }
}
