import type { ToParam } from "../../schemas";
import type { ValueType } from "../../types";
import { isString } from "../../validate/validate-type";
import { val } from "../builders";
import type { ParamaterValue } from "../types";

export const lowercaseFunctionType = "lowercase";

export type LowercaseFunction<TValue extends ParamaterValue = never> = {
  type: typeof lowercaseFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates a lowercase transformer that converts a string to lower case.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 *
 * @category Transformer
 * @param value - The string value to convert (reference, static value, or another transformer)
 * @returns A Transformer that computes the lower-cased string
 *
 * @example
 * // Validate an email address regardless of the casing it was entered in
 * eq(lowercase(ref('email')), v('user@example.com'))
 *
 * @see {@link uppercase} - Uppercase transformer
 * @see {@link trim} - Trim transformer
 * @see {@link capitalize} - Capitalize transformer
 */
export function lowercase<const T extends ParamaterValue<string> | string>(value: T): LowercaseFunction<ToParam<T>> {
  return {
    type: lowercaseFunctionType,
    value: (isString(value) ? val(value) : value) as ToParam<T>,
  };
}

export function lowercaseFunction(value: ValueType | undefined): string {
  return isString(value) ? value.toLowerCase() : "";
}
