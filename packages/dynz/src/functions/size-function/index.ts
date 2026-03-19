import { isDate } from "date-fns";
import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import { isArray, isFile, isString } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const sizeFunctionType = "size";

export type SizeFunction<TValue extends ParamaterValue = never> = {
  type: typeof sizeFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates a size transformer that returns the length/size of a value.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The size transformer returns:
 * - For strings: the character count
 * - For arrays: the number of elements
 * - For objects: the number of keys
 *
 * @category Transformer
 * @param value - The value to get the size of (reference, static value, etc.)
 * @returns A Transformer that computes the size of the value
 *
 * @example
 * // Check if tags array has at least 3 items
 * gte(size(ref('tags')), v(3))
 *
 * @example
 * // Use in a predicate for conditional logic
 * conditional({
 *   when: gt(size(ref('items')), v(10)),
 *   then: equals(v(true), 'Bulk order confirmation required')
 * })
 *
 * @see {@link minLength} - Rule for minimum length validation
 * @see {@link maxLength} - Rule for maximum length validation
 */
export function size<const T extends ParamaterValue>(value: T): SizeFunction<T> {
  return {
    type: sizeFunctionType,
    value,
  };
}

export function sizeFunction(value: ValueType | undefined): number {
  if (isString(value) || isArray(value)) {
    return value.length;
  }

  if (isDate(value)) {
    return value.getTime();
  }

  if (isFile(value)) {
    return value.size;
  }

  return coerceNumber(value);
}
