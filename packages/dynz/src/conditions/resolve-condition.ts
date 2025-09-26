import { unpackRef } from "../reference";
import type { ValueOrReference } from "../reference/reference";
import { type ResolveContext, type Schema, SchemaType, type ValueType } from "../types";
import { ensureAbsolutePath, getNested } from "../utils";
import { assertArray, isString, parseDateString, validateSchema } from "../validate";
import {
  type Condition,
  ConditionType,
  type EqualsCondition,
  type GreaterThanCondition,
  type GreaterThanOrEqualCondition,
  type LowerThanCondition,
  type LowerThanOrEqualCondition,
  type NotEqualsCondition,
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

      return new RegExp(condition.value).test(left);
    }
    case ConditionType.IS_IN: {
      const { left, right } = getConditionOperands(condition, path, context);
      return assertArray(right).includes(left);
    }
    case ConditionType.IS_NOT_IN: {
      const { left, right } = getConditionOperands(condition, path, context);
      return !assertArray(right).includes(left);
    }
  }
}

const OPERATORS = {
  [ConditionType.EQUALS]: (a: ValueType, b: ValueType) => {
    return a === b;
  },
  [ConditionType.NOT_EQUALS]: (a: ValueType, b: ValueType) => a === b,
  [ConditionType.GREATHER_THAN]: (a: ValueType, b: ValueType) => a > b,
  [ConditionType.GREATHER_THAN_OR_EQUAL]: (a: ValueType, b: ValueType) => a >= b,
  [ConditionType.LOWER_THAN]: (a: ValueType, b: ValueType) => a < b,
  [ConditionType.LOWER_THAN_OR_EQUAL]: (a: ValueType, b: ValueType) => a <= b,
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
  condition: { path: string; value: ValueOrReference<T> | ValueOrReference<T>[] },
  path: string,
  context: ResolveContext
): { left?: ValueType | undefined; right?: ValueType | undefined } {
  const nested = getNested(ensureAbsolutePath(condition.path, path), context.schema, context.values.new);

  const left = validateSchema(nested.schema, nested.value) ? toCompareType(nested.schema, nested.value) : undefined;

  if (Array.isArray(condition.value)) {
    return {
      left,
      right: condition.value.map((val) => {
        // TODO: Fix this!
        const unpacked = unpackRef(val as ValueType, path, context);

        if (unpacked.static) {
          // TODO: Add dev check to ensure value is of type ValueType
          return validateSchema(nested.schema, unpacked.value as ValueType)
            ? toCompareType(nested.schema, unpacked.value as ValueType)
            : undefined;
        }

        return validateSchema(unpacked.schema, unpacked.value)
          ? toCompareType(unpacked.schema, unpacked.value)
          : undefined;
      }),
    };
  }

  const unpacked = unpackRef(condition.value, path, context);

  if (unpacked.static) {
    return {
      left: left,
      // TODO: Add dev check to ensure value is of type ValueType
      right: validateSchema(nested.schema, unpacked.value as ValueType)
        ? toCompareType(nested.schema, unpacked.value as ValueType)
        : undefined,
    };
  }

  return {
    left: left,
    right: validateSchema(unpacked.schema, unpacked.value) ? toCompareType(unpacked.schema, unpacked.value) : undefined,
  };
}

/**
 * Converts a value to a comparable type based on the schema.
 * For date strings, converts to milliseconds for proper comparison.                                                                                                                                                                 
│* For other types, returns the value unchanged.
 */
function toCompareType<T extends Schema>(schema: T, value: ValueType): ValueType | number {
  if (schema.type === SchemaType.DATE_STRING) {
    return parseDateString(`${value}`, schema.format).getTime();
  }

  return value;
}
