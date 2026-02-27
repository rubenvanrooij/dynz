import { isDate } from "date-fns";
import type { Reference } from "../reference";
import type { ResolveContext, SchemaType, ValueType } from "../types";
import { coerce, coerceSchema, ensureAbsolutePath, getNested } from "../utils";
import { isArray, isFile, isString, validateShallowType, validateType } from "../validate/validate-type";
import { type ParamaterValue, type Predicate, PredicateType, type Transformer, TransformerType } from "./types";

export function unpackRef<T extends SchemaType = SchemaType>(
  ref: Reference,
  path: string,
  context: ResolveContext,
  ...expected: T[]
): ValueType<T> | undefined {
  const { schema, value } = getNested(ensureAbsolutePath(ref.path, path), context.schema, context.values.new);

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

    if (validateType(schema, val)) {
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

export function resolve(input: ParamaterValue, path: string, context: ResolveContext): ValueType | undefined {
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
  switch (input.type) {
    case PredicateType.AND:
      return input.predicates.every((cond) => resolve(cond, path, context));
    case PredicateType.OR:
      return input.predicates.some((cond) => resolve(cond, path, context));
    case PredicateType.EQUALS: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      return left === right;
    }
    case PredicateType.IS_IN: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);

      if (!isArray(right) || left === undefined) {
        return undefined;
      }

      return right.includes(left);
    }
    case PredicateType.IS_NOT_IN: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);

      if (!isArray(right) || left === undefined) {
        return undefined;
      }

      return !right.includes(left);
    }
    case PredicateType.NOT_EQUALS: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      return left !== right;
    }
    case PredicateType.GREATHER_THAN: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left > +right;
    }
    case PredicateType.CUSTOM: {
      throw new Error("not yet implemented");
    }
    case PredicateType.GREATHER_THAN_OR_EQUAL: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left >= +right;
    }
    case PredicateType.LOWER_THAN: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left < +right;
    }
    case PredicateType.LOWER_THAN_OR_EQUAL: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left <= +right;
    }
    case PredicateType.MATCHES: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || isString(right) === false) {
        return undefined;
      }
      return new RegExp(right, input.flags).test(left.toString());
    }
  }
}

export function resolveFunction(
  input: Predicate | Transformer,
  path: string,
  context: ResolveContext
): ValueType | undefined {
  switch (input.type) {
    case PredicateType.AND:
      return input.predicates.every((cond) => resolve(cond, path, context));
    case PredicateType.OR:
      return input.predicates.some((cond) => resolve(cond, path, context));
    case PredicateType.EQUALS: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      return left === right;
    }
    case PredicateType.IS_IN: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);

      if (!isArray(right) || left === undefined) {
        return undefined;
      }

      return right.includes(left);
    }
    case PredicateType.IS_NOT_IN: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);

      if (!isArray(right) || left === undefined) {
        return undefined;
      }

      return !right.includes(left);
    }
    case PredicateType.NOT_EQUALS: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      return left !== right;
    }
    case PredicateType.GREATHER_THAN: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left > +right;
    }
    case PredicateType.CUSTOM: {
      throw new Error("not yet implemented");
    }
    case PredicateType.GREATHER_THAN_OR_EQUAL: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left >= +right;
    }
    case PredicateType.LOWER_THAN: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left < +right;
    }
    case PredicateType.LOWER_THAN_OR_EQUAL: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left <= +right;
    }
    case PredicateType.MATCHES: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || isString(right) === false) {
        return undefined;
      }
      return new RegExp(right, input.flags).test(left.toString());
    }
    case TransformerType.SUM: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return NaN;
      }
      return +left + +right;
    }
    case TransformerType.SUB: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return NaN;
      }
      return +left - +right;
    }
    case TransformerType.MULTIPLY: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return NaN;
      }
      return +left * +right;
    }
    case TransformerType.DIVIDE: {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return NaN;
      }
      return +left / +right;
    }
    case TransformerType.SIZE: {
      const val = resolve(input.value, path, context);

      if (isString(val) || isArray(val)) {
        return val.length;
      }

      if (isDate(val)) {
        console.log("isDate!", val);
        return val.getTime();
      }

      if (isFile(val)) {
        return val.size;
      }

      return val;
    }
    case TransformerType.AGE: {
      const val = resolve(input.value, path, context);

      if (isDate(val)) {
        return getAge(val);
      }

      return NaN;
    }
  }
}

function getAge(birthDate: Date) {
  var today = new Date();
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
