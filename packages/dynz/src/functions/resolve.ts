import { resolveProperty } from "../conditions";
import { GLOBAL_TYPE, type GlobalReference } from "../global";
import { REFERENCE_TYPE, type Reference } from "../reference";
import type { ResolveContext, Schema, SchemaType, ValueType } from "../types";
import { coerce, coerceSchema, ensureAbsolutePath, getNested } from "../utils";
import { validateShallowType, validateType } from "../validate/validate-type";
import type { Predicate } from "./predicate-types";
import { PREDICATES } from "./predicates";
import type { Transformer } from "./transformer-types";
import { TRANSFORMERS } from "./transformers";
import { type ParamaterValue, STATIC_TYPE } from "./types";

export function unpackRef<T extends SchemaType = SchemaType>(
  ref: Reference,
  path: string,
  context: ResolveContext,
  ...expected: T[]
): ValueType<T> | undefined {
  const absolutePath = ensureAbsolutePath(ref.path, path);

  // getNested returns null when the path cannot be resolved — this happens when
  // navigating through a discriminated union whose discriminator value does not
  // match any member (e.g. the field is empty or the current value is an excluded
  // member). Treat this as "not accessible" → behave as if not included.
  const ret = getNested(absolutePath, context.schema, context.values);

  if (ret === null) {
    return undefined;
  }

  const { schema, value } = ret;

  // only return when the schema is actually included
  if (!resolveProperty("included", absolutePath, true, context)) {
    return undefined;
  }

  if (schema.type === "expression") {
    return resolve(schema.value, absolutePath, context) as ValueType<T>;
  }

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

export function unpackGlobal<T = unknown>(ref: GlobalReference, context: ResolveContext): T | undefined {
  const globals = context.globals ?? {};

  if (!Object.hasOwn(globals, ref.key)) {
    throw new Error(
      `Global variable "${ref.key}" could not be found. Make sure to supply it via validate(schema, current, new, { globals: { "${ref.key}": ... } }).`
    );
  }

  const value = globals[ref.key];

  if (!validateShallowType(ref.globalType, value)) {
    throw new Error(
      `Global variable "${ref.key}" was declared as "${ref.globalType}" via createGlobals(), but the supplied value (${JSON.stringify(value)}) does not match. Check the value passed via validate(schema, current, new, { globals: { "${ref.key}": ... } }).`
    );
  }

  return value as T;
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

  if (input.type === REFERENCE_TYPE) {
    return unpackRef(input, path, context);
  }

  if (input.type === GLOBAL_TYPE) {
    return unpackGlobal(input, context);
  }

  if (input.type === STATIC_TYPE) {
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
    // expects array of input values
    case "sum":
    case "sub":
    case "divide":
    case "multiply":
    case "min":
    case "max": {
      const resolved = Array.isArray(input.value)
        ? input.value.map((val) => resolve(val, path, context))
        : resolve(input.value, path, context);
      return FUNCTIONS[input.type](Array.isArray(resolved) ? resolved : [resolved]);
    }
    case "pluck":
      return FUNCTIONS[input.type](resolve(input.array, path, context), input.property);
    // expects single input value
    case "lookup":
      return FUNCTIONS[input.type](resolve(input.value, path, context), resolve(input.lookup, path, context));
    default:
      return FUNCTIONS[input.type](resolve(input.value, path, context));
  }
}
