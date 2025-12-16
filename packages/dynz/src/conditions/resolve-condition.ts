import { isDate } from "date-fns";
import { V } from "vitest/dist/chunks/environment.d.cL3nLXbE";
import { unpackRef } from "../reference";
import type { Reference, ValueOrReference } from "../reference/reference";
import { type ResolveContext, type Schema, SchemaType, type ValueType } from "../types";
import { ensureAbsolutePath, getNested } from "../utils";
import { isArray, isFile, isNumber, isString, parseDateString, validateType } from "../validate/validate-type";
import {
  type Condition,
  ConditionType,
  type EqualsCondition,
  type GreaterThanCondition,
  type GreaterThanOrEqualCondition,
  type LowerThanCondition,
  type LowerThanOrEqualCondition,
  type NotEqualsCondition,
  type Operator,
} from "./types";

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
      const { value: left } = getNested(ensureAbsolutePath(condition.path, path), context.schema, context.values.new);

      if (!isString(left)) {
        throw new Error(
          `Condition ${condition.type} expects a string value at path ${condition.path}, but got ${typeof left}`
        );
      }

      return new RegExp(condition.value, condition.flags).test(left);
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

function getSizeCompareValue(value: ValueType): ValueType | number {
  // // Handle special case where the schema type is a date string
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
  [ConditionType.EQUALS]: (a: ValueType, b: ValueType) => {
    return a === b;
  },
  [ConditionType.NOT_EQUALS]: (a: ValueType, b: ValueType) => a !== b,
  [ConditionType.GREATHER_THAN]: (a: ValueType, b: ValueType) => getSizeCompareValue(a) > getSizeCompareValue(b),
  [ConditionType.GREATHER_THAN_OR_EQUAL]: (a: ValueType, b: ValueType) =>
    getSizeCompareValue(a) >= getSizeCompareValue(b),
  [ConditionType.LOWER_THAN]: (a: ValueType, b: ValueType) => getSizeCompareValue(a) < getSizeCompareValue(b),
  [ConditionType.LOWER_THAN_OR_EQUAL]: (a: ValueType, b: ValueType) => getSizeCompareValue(a) <= getSizeCompareValue(b),
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
  condition: { path: string | Operator; value: ValueOrReference<T> | ValueOrReference<T>[] | Operator | undefined },
  path: string,
  context: ResolveContext
): { left?: ValueType | undefined; right?: ValueType | undefined } {
  const getLeft = () => {
    if (isOperator(condition.path)) {
      return resolveOperator(condition.path, path, context);
    }

    const nested = getNested(ensureAbsolutePath(condition.path, path), context.schema, context.values.new);
    return validateType(nested.schema, nested.value) ? nested.value : undefined;
  };

  const left = getLeft();

  if (isOperator(condition.value)) {
    return {
      left,
      right: resolveOperator(condition.value, path, context),
    };
  }

  if (Array.isArray(condition.value)) {
    return {
      left,
      right: condition.value.map((val) => {
        const unpacked = unpackRef(val as ValueType, path, context);

        if (unpacked.static) {
          return unpacked.value as ValueType;
        }

        return unpacked.value as ValueType;
      }),
    };
  }

  const unpacked = unpackRef(condition.value, path, context);

  if (unpacked.static) {
    return {
      left: left,
      right: unpacked.value as ValueType,
    };
  }

  return {
    left: left,
    right: unpacked.value as ValueType,
  };
}

function resolveOperator(operator: Operator, path: string, context: ResolveContext): ValueType | undefined {
  const left = resolveOperatorField(operator.left, path, context);
  const right = resolveOperatorField(operator.right, path, context);

  if (left === undefined || right === undefined) {
    return undefined;
  }

  switch (operator.type) {
    case "+":
      return +left + +right;
    case "-":
      return +left - +right;
    case "*":
      return +left * +right;
    case "/":
      return +left / +right;
    case "%":
      return +left % +right;
    default:
      throw new Error(`Unknown operator type: ${operator.type}`);
  }
}

function isOperator(operator: unknown): operator is Operator {
  return typeof operator === "object" && operator !== null && "_type" in operator && operator._type === "__dop";
}

function resolveOperatorField(
  field: ValueType | Reference | Operator,
  path: string,
  context: ResolveContext
): ValueType | undefined {
  if (isOperator(field)) {
    return resolveOperator(field, path, context);
  }

  return unpackRef(field, path, context).value as ValueType;
}
