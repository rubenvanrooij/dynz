import type { ToParam } from "../../schemas";
import type { ValueType } from "../../types";
import { isString } from "../../validate/validate-type";
import { val } from "../builders";
import type { ParamaterValue } from "../types";

export const uppercaseFunctionType = "uppercase";

export type UppercaseFunction<TValue extends ParamaterValue = never> = {
  type: typeof uppercaseFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates an uppercase transformer that converts a string to upper case.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 *
 * @category Transformer
 * @param value - The string value to convert (reference, static value, or another transformer)
 * @returns A Transformer that computes the upper-cased string
 *
 * @example
 * // Validate a country code regardless of the casing it was entered in
 * eq(uppercase(ref('countryCode')), v('NL'))
 *
 * @see {@link lowercase} - Lowercase transformer
 * @see {@link trim} - Trim transformer
 * @see {@link capitalize} - Capitalize transformer
 */
export function uppercase<const T extends ParamaterValue<string> | string>(value: T): UppercaseFunction<ToParam<T>> {
  return {
    type: uppercaseFunctionType,
    value: (isString(value) ? val(value) : value) as ToParam<T>,
  };
}

export function uppercaseFunction(value: ValueType | undefined): string {
  return isString(value) ? value.toUpperCase() : "";
}
