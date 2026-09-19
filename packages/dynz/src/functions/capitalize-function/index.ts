import type { ToParam } from "../../schemas";
import type { ValueType } from "../../types";
import { isString } from "../../validate/validate-type";
import { val } from "../builders";
import type { ParamaterValue } from "../types";

export const capitalizeFunctionType = "capitalize";

export type CapitalizeFunction<TValue extends ParamaterValue = never> = {
  type: typeof capitalizeFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates a capitalize transformer that upper-cases the first letter of a string
 * and lower-cases the rest.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 *
 * @category Transformer
 * @param value - The string value to capitalize (reference, static value, or another transformer)
 * @returns A Transformer that computes the capitalized string
 *
 * @example
 * // Validate a name is stored with consistent casing
 * eq(capitalize(ref('firstName')), ref('firstName'))
 *
 * @see {@link uppercase} - Uppercase transformer
 * @see {@link lowercase} - Lowercase transformer
 * @see {@link trim} - Trim transformer
 */
export function capitalize<const T extends ParamaterValue<string> | string>(value: T): CapitalizeFunction<ToParam<T>> {
  return {
    type: capitalizeFunctionType,
    value: (isString(value) ? val(value) : value) as ToParam<T>,
  };
}

export function capitalizeFunction(value: ValueType | undefined): string {
  if (!isString(value) || value.length === 0) {
    return isString(value) ? value : "";
  }

  return value[0].toUpperCase() + value.slice(1).toLowerCase();
}
