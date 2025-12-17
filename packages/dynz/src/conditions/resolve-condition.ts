import { isDate } from "date-fns";
import { UnpackedReferenceValue, unpackRef } from "../reference";
import type { ResolveContext, SchemaType, Unpacked, ValueType, ValueTypeOrUndefined } from "../types";
import { isArray, isFile, isNumber, isString, validateShallowType } from "../validate/validate-type";
import {
  type AndCondition,
  type Condition,
  ConditionType,
  type ConditionValue,
  type EqualsCondition,
  type Func,
  FunctionType,
  type GreaterThanCondition,
  type GreaterThanOrEqualCondition,
  type LowerThanCondition,
  type LowerThanOrEqualCondition,
  type NotEqualsCondition,
  type OrCondition,
} from "./types";

export function isFunction(value: unknown): value is Func {
  if (typeof value === "object" && value !== null && "_type" in value && value._type === "__func__") {
    return true;
  }
  return false;
}

function resolveFunction(value: Func, path: string, context: ResolveContext): ValueType | undefined {
  const left = resolve(value.left, path, context);
  const right = resolve(value.right, path, context);

  switch (value.type) {
    case FunctionType.ADD: {
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return +left + +right;
    }

    case FunctionType.MIN: {
      if (left === undefined || right === undefined) {
        return undefined;
      }
      return Math.min(+left, +right);
    }
    default:
      throw new Error(`Unknown function type: ${value.type}`);
  }
}

export function resolve(value: ConditionValue, path: string, context: ResolveContext): ValueType | undefined;
export function resolve<T extends SchemaType>(
  value: ConditionValue,
  path: string,
  context: ResolveContext,
  ...expected: T[]
): ValueType<Unpacked<T>> | undefined;
export function resolve<T extends SchemaType = SchemaType>(
  value: ConditionValue,
  path: string,
  context: ResolveContext,
  ...expected: T[]
): ValueType | undefined {
  if (isFunction(value)) {
    const ret = resolveFunction(value, path, context);

    if (ret === undefined) {
      return ret;
    }

    if (expected.length > 0 && expected.some((type) => !validateShallowType(type, ret))) {
      console.warn(`Expected type ${expected.join(", ")} but got ${typeof ret}`);
      return undefined;
    }

    return ret;
  }

  return unpackRef(value, path, context, ...expected).value;
}

export function resolveCondition(condition: Condition, path: string, context: ResolveContext): boolean {
  switch (condition.type) {
    case ConditionType.AND:
      return condition.conditions.every((condition) => resolveCondition(condition, path, context));
    case ConditionType.OR:
      return condition.conditions.some((condition) => resolveCondition(condition, path, context));
    case ConditionType.EQUALS:
    case ConditionType.NOT_EQUALS:
    case ConditionType.GREATHER_THAN:
    case ConditionType.GREATHER_THAN_OR_EQUAL:
    case ConditionType.LOWER_THAN:
    case ConditionType.LOWER_THAN_OR_EQUAL:
      return validateWithOperator(condition, path, context);
    case ConditionType.MATCHES: {
      const left = resolve(condition.left, path, context);

      if (!isString(left)) {
        throw new Error(
          `Condition ${condition.type} expects a string value at path ${condition.left}, but got ${typeof left}`
        );
      }

      return new RegExp(condition.right, condition.flags).test(left);
    }
    case ConditionType.IS_IN: {
      const { left, right } = getConditionOperands(condition, path, context);
      return (Array.isArray(right) ? right : [right]).includes(left);
    }
    case ConditionType.IS_NOT_IN: {
      const { left, right } = getConditionOperands(condition, path, context);
      return !(Array.isArray(right) ? right : [right]).includes(left);
    }
  }
}

function getSizeCompareValue(value: ValueType | Array<ValueTypeOrUndefined>): ValueType {
  // Handle special case where the schema type is a date string
  // if (schema.type === SchemaType.DATE_STRING && isString(value)) {
  //   return parseDateString(value, schema.format).getTime();
  // }

  if (isNumber(value)) {
    return value;
  }

  if (isString(value) || isArray(value)) {
    return value.length;
  }

  if (isDate(value)) {
    console.log("isDate!", value);
    return value.getTime();
  }

  if (isFile(value)) {
    return value.size;
  }

  return value;
}

const OPERATORS = {
  [ConditionType.EQUALS]: (a: ValueType, b: ValueType | Array<ValueTypeOrUndefined>) => {
    return a === b;
  },
  [ConditionType.NOT_EQUALS]: (a: ValueType, b: ValueType | Array<ValueTypeOrUndefined>) => a !== b,
  [ConditionType.GREATHER_THAN]: (a: ValueType, b: ValueType | Array<ValueTypeOrUndefined>) =>
    getSizeCompareValue(a) > getSizeCompareValue(b),
  [ConditionType.GREATHER_THAN_OR_EQUAL]: (a: ValueType, b: ValueType | Array<ValueTypeOrUndefined>) =>
    getSizeCompareValue(a) >= getSizeCompareValue(b),
  [ConditionType.LOWER_THAN]: (a: ValueType, b: ValueType | Array<ValueTypeOrUndefined>) =>
    getSizeCompareValue(a) < getSizeCompareValue(b),
  [ConditionType.LOWER_THAN_OR_EQUAL]: (a: ValueType, b: ValueType | Array<ValueTypeOrUndefined>) =>
    getSizeCompareValue(a) <= getSizeCompareValue(b),
} as const;

function validateWithOperator(
  condition:
    | EqualsCondition
    | NotEqualsCondition
    | GreaterThanCondition
    | LowerThanCondition
    | GreaterThanOrEqualCondition
    | LowerThanOrEqualCondition,
  path: string,
  context: ResolveContext
): boolean {
  const { left, right } = getConditionOperands(condition, path, context);

  console.log(`validateWithOperator: ${condition.type}`, left, right);

  // Both operands must be defined for comparison
  if (left === undefined || right === undefined) {
    return false;
  }

  return OPERATORS[condition.type](left, right);
}

/**
 * Returns the condition operands for a specific condition and validates whether the type of the value is correct
 * for a referenced value it is using the referenced schema type; for a static value it is using the schema type of
 * the validated schema itself. When the value does not comply with the schema type, it returns undefined.
 *
 * @param condition
 * @param path
 * @param context
 * @returns
 */
function getConditionOperands<T extends ValueType>(
  condition: Exclude<Condition, AndCondition | OrCondition>,
  path: string,
  context: ResolveContext
): { left?: ValueType | undefined; right?: ValueType | undefined | Array<ValueType | undefined> } {
  const left = resolve(condition.left, path, context);

  if (Array.isArray(condition.right)) {
    return {
      left,
      right: condition.right.map((val) => {
        if (isFunction(val)) {
          return resolve(val, path, context);
        }

        const unpacked = unpackRef(val, path, context);

        if (unpacked.static) {
          return unpacked.value;
        }

        return unpacked.value;
      }),
    };
  }

  const right = resolve(condition.right, path, context); // unpackRef(condition.right, path, context);

  return {
    left,
    right,
  };
}
