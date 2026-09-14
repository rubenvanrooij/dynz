import type { ToParam } from "../../schemas";
import type { ValueType } from "../../types";
import { isString } from "../../validate/validate-type";
import { val } from "../builders";
import type { ParamaterValue } from "../types";

export const trimFunctionType = "trim";

export type TrimFunction<TValue extends ParamaterValue = never> = {
  type: typeof trimFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates a trim transformer that removes leading/trailing whitespace from a string.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 *
 * @category Transformer
 * @param value - The string value to trim (reference, static value, or another transformer)
 * @returns A Transformer that computes the trimmed string
 *
 * @example
 * // Validate a username ignoring surrounding whitespace
 * eq(trim(ref('username')), v('admin'))
 *
 * @see {@link uppercase} - Uppercase transformer
 * @see {@link lowercase} - Lowercase transformer
 * @see {@link capitalize} - Capitalize transformer
 */
export function trim<const T extends ParamaterValue<string> | string>(value: T): TrimFunction<ToParam<T>> {
  return {
    type: trimFunctionType,
    value: (isString(value) ? val(value) : value) as ToParam<T>,
  };
}

export function trimFunction(value: ValueType | undefined): string {
  return isString(value) ? value.trim() : "";
}
