import type { ValueType } from "../../types";
import type { ParamaterValue } from "../types";

export const pluckFunctionType = "pluck";

export type PluckFunction<TArray extends ParamaterValue = never> = {
  type: typeof pluckFunctionType;
  array: [TArray] extends [never] ? ParamaterValue : TArray;
  property: string;
};

/**
 * Extracts a named property from each item in an array, returning an array of values.
 *
 * Commonly used with {@link sum} to aggregate numeric properties across array items.
 *
 * @category Transformer
 * @param array - A reference to an array field
 * @param property - The property name to extract from each item
 *
 * @example
 * // Sum the `length` property of each item in `items`
 * d.expr(d.sum(d.pluck(d.ref('items'), 'length')))
 */
export function pluck<const T extends ParamaterValue>(array: T, property: string): PluckFunction<T> {
  return {
    type: pluckFunctionType,
    array,
    property,
  };
}

export function pluckFunction(array: ValueType | undefined, property: string): ValueType[] {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.map((item) => (property in item ? item[property] : undefined));
}
