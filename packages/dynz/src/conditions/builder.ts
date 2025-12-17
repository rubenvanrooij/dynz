import {
  type AgeFunc,
  type AndCondition,
  type BaseFunc,
  type Condition,
  ConditionType,
  type ConditionValue,
  type EqualsCondition,
  type Func,
  type FunctionType,
  type FunctionValue,
  type GreaterThanCondition,
  type GreaterThanOrEqualCondition,
  type IsInCondition,
  type IsNotInCondition,
  type LowerThanCondition,
  type LowerThanOrEqualCondition,
  type MatchesCondition,
  type NotEqualsCondition,
  type OrCondition,
} from "./types";

export function and<const T extends Condition[]>(...conditions: T): Pick<AndCondition, "type"> & { conditions: T } {
  return {
    type: ConditionType.AND,
    conditions,
  };
}

export function or<const T extends Condition[]>(...conditions: T): Pick<OrCondition, "type"> & { conditions: T } {
  return {
    type: ConditionType.OR,
    conditions,
  };
}

export function eq<const T extends ConditionValue, const V extends ConditionValue>(
  left: T,
  right: V
): EqualsCondition<T, V> {
  return {
    type: ConditionType.EQUALS,
    left,
    right,
  };
}

export function neq<const T extends ConditionValue, const V extends ConditionValue>(
  left: T,
  right: V
): NotEqualsCondition<T, V> {
  return {
    type: ConditionType.NOT_EQUALS,
    left,
    right,
  };
}

export function gt<const T extends ConditionValue, const V extends ConditionValue>(
  left: T,
  right: V
): GreaterThanCondition<T, V> {
  return {
    type: ConditionType.GREATHER_THAN,
    left,
    right,
  };
}

export function gte<const T extends ConditionValue, const V extends ConditionValue>(
  left: T,
  right: V
): GreaterThanOrEqualCondition<T, V> {
  return {
    type: ConditionType.GREATHER_THAN_OR_EQUAL,
    left,
    right,
  };
}

export function lt<const T extends ConditionValue, const V extends ConditionValue>(
  left: T,
  right: V
): LowerThanCondition<T, V> {
  return {
    type: ConditionType.LOWER_THAN,
    left,
    right,
  };
}

export function lte<const T extends ConditionValue, const V extends ConditionValue>(
  left: T,
  right: V
): LowerThanOrEqualCondition<T, V> {
  return {
    type: ConditionType.LOWER_THAN_OR_EQUAL,
    left,
    right,
  };
}

export function matches<const T extends ConditionValue>(left: T, right: string, flags?: string): MatchesCondition<T> {
  return {
    type: ConditionType.MATCHES,
    left,
    right,
    flags,
  };
}

export function isIn<const T extends ConditionValue, const V extends Array<ConditionValue>>(
  left: T,
  right: V
): IsInCondition<T, V> {
  return {
    type: ConditionType.IS_IN,
    left,
    right,
  };
}

export function isNotIn<const T extends ConditionValue, const V extends Array<ConditionValue>>(
  left: T,
  right: V
): IsNotInCondition<T, V> {
  return {
    type: ConditionType.IS_NOT_IN,
    left,
    right,
  };
}

/**
 * FUNCTIONS
 */

export function sum<const T extends FunctionValue, const V extends FunctionValue>(
  left: T,
  right: V
): BaseFunc<typeof FunctionType.SUM, T, V> {
  return {
    _type: "__func__",
    type: "sum",
    left,
    right,
  };
}

export function sub<const T extends FunctionValue, const V extends FunctionValue>(
  left: T,
  right: V
): BaseFunc<typeof FunctionType.SUB, T, V> {
  return {
    _type: "__func__",
    type: "sub",
    left,
    right,
  };
}

export function mul<const T extends FunctionValue, const V extends FunctionValue>(
  left: T,
  right: V
): BaseFunc<typeof FunctionType.MUL, T, V> {
  return {
    _type: "__func__",
    type: "mul",
    left,
    right,
  };
}

export function div<const T extends FunctionValue, const V extends FunctionValue>(
  left: T,
  right: V
): BaseFunc<typeof FunctionType.DIV, T, V> {
  return {
    _type: "__func__",
    type: "div",
    left,
    right,
  };
}

export function age<const T extends FunctionValue>(left: T): AgeFunc<T> {
  return {
    _type: "__func__",
    type: "age",
    left,
  };
}
// export function min<const T extends FunctionValue, const V extends FunctionValue>(
//   left: T,
//   right: V
// ): Func<typeof FunctionType.MIN, T, V> {
//   return {
//     _type: "__func__",
//     type: "min",
//     left,
//     right,
//   };
// }
