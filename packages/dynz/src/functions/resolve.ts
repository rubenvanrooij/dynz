import { isDate } from "date-fns";
import type { ResolveContext, SchemaType, Unpacked, ValueType } from "../types";
import { coerce, coerceSchema, ensureAbsolutePath, getNested } from "../utils";
import { isArray, isFile, isNumber, isString, validateShallowType, validateType } from "../validate/validate-type";
import type { ParamaterValue, Reference } from "./types";

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

export function resolve(input: ParamaterValue, path: string, context: ResolveContext): ValueType | undefined {
  if (input === undefined) {
    return undefined;
  }

  switch (input.type) {
    case "ref":
      return unpackRef(input, path, context);
    case "static":
      return input.value;
    case "and":
      return input.predicates.every((cond) => resolve(cond, path, context));
    case "or":
      return input.predicates.some((cond) => resolve(cond, path, context));
    case "eq": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      return left === right;
    }
    case "neq": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      return left !== right;
    }
    case "gt": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left > +right;
    }
    case "gte": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left >= +right;
    }
    case "lt": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left < +right;
    }
    case "lte": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left <= +right;
    }
    case "matches": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || isString(right) === false) {
        return undefined;
      }
      return new RegExp(right, input.flags).test(left.toString());
    }
    case "sum": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left + +right;
    }
    case "sub": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left - +right;
    }
    case "multiply": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left * +right;
    }
    case "divide": {
      const left = resolve(input.left, path, context);
      const right = resolve(input.right, path, context);
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left / +right;
    }
    case "size": {
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
  }

  switch (func.type) {
    case "sum":
      return ((resolve(func.left) as number) + resolve(func.right)) as number;
    case "sub":
      return ((resolve(func.left) as number) - resolve(func.right)) as number;
    case "multiply":
      return ((resolve(func.left) as number) * resolve(func.right)) as number;
    case "divide":
      return ((resolve(func.left) as number) / resolve(func.right)) as number;
  }
}
