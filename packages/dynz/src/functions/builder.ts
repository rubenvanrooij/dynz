import type { ValueType } from "../types";
import {
  type DefaultPredicate,
  type LeftRightTransformer,
  type ParamaterValue,
  PredicateType,
  type Reference,
  type Static,
  TransformerType,
} from "./types";

/**
 *
 * @param left
 * @param right
 * @returns
 */
export function _<const T extends ValueType>(val: T): Static<T> {
  return {
    type: "static",
    value: val,
  };
}

export function ref<const T extends string>(val: T): Reference<T> {
  return {
    type: "ref",
    path: val,
  };
}

export function gt<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.GREATHER_THAN, T, V> {
  return {
    type: PredicateType.GREATHER_THAN,
    left,
    right,
  };
}

/**
 * Build to create a predicate that validates whether the left is greater than or equal to right (left >= right)
 *
 * @param left ParamterValue
 * @param right ParamterValue
 * @returns DefaultPredicate<typeof PredicateType.GREATHER_THAN_OR_EQUAL, T, V>
 */
export function gte<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.GREATHER_THAN_OR_EQUAL, T, V> {
  return {
    type: PredicateType.GREATHER_THAN_OR_EQUAL,
    left,
    right,
  };
}

export function lt<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.LOWER_THAN, T, V> {
  return {
    type: PredicateType.LOWER_THAN,
    left,
    right,
  };
}

export function lte<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.LOWER_THAN_OR_EQUAL, T, V> {
  return {
    type: PredicateType.LOWER_THAN_OR_EQUAL,
    left,
    right,
  };
}

export function eq<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.EQUALS, T, V> {
  return {
    type: PredicateType.EQUALS,
    left,
    right,
  };
}

export function neq<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.NOT_EQUALS, T, V> {
  return {
    type: PredicateType.NOT_EQUALS,
    left,
    right,
  };
}

/***
 * TRANSFORMERS
 */

export function sub<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): LeftRightTransformer<typeof TransformerType.SUB, T, V> {
  return {
    type: TransformerType.SUB,
    left,
    right,
  };
}

export function sum<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): LeftRightTransformer<typeof TransformerType.SUM, T, V> {
  return {
    type: TransformerType.SUM,
    left,
    right,
  };
}

export function multiply<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): LeftRightTransformer<typeof TransformerType.MULTIPLY, T, V> {
  return {
    type: TransformerType.MULTIPLY,
    left,
    right,
  };
}

export function divide<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): LeftRightTransformer<typeof TransformerType.DIVIDE, T, V> {
  return {
    type: TransformerType.DIVIDE,
    left,
    right,
  };
}

export function size<const T extends ParamaterValue>(value: T): { type: typeof TransformerType.SIZE; value: T } {
  return {
    type: TransformerType.SIZE,
    value,
  };
}
