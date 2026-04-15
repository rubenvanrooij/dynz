import type { ToParam } from "../../schemas";
import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import { isNumber } from "../../validate/validate-type";
import { val } from "../builders";
import type { ParamaterValue } from "../types";

export const cosFunctionType = "cos";

export type CosFunction<TValue extends ParamaterValue = never> = {
  type: typeof cosFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates a cosine transformer that calculates the cosine of a value (in degrees).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The cosine transformer applies the mathematical cosine function to the input value.
 *
 * @category Transformer
 * @param value - The angle in degrees (reference, static value, or another transformer)
 * @returns A Transformer that computes cos(value)
 *
 * @example
 * // Calculate the cosine of an angle field
 * cos(ref('angleInDegrees'))
 *
 * @example
 * // Use in coordinate calculations
 * multiply(ref('radius'), cos(ref('theta')))
 *
 * @example
 * // Pythagorean identity check
 * sum(multiply(sin(ref('x')), sin(ref('x'))), multiply(cos(ref('x')), cos(ref('x'))))
 *
 * @see {@link sin} - Sine transformer
 * @see {@link tan} - Tangent transformer
 */
export function cos<const T extends ParamaterValue<number> | number>(value: T): CosFunction<ToParam<T>> {
  return {
    type: cosFunctionType,
    value: (isNumber(value) ? val(value) : value) as ToParam<T>,
  };
}

export function cosFunction(value: ValueType | undefined): number {
  return Math.cos((coerceNumber(value) * Math.PI) / 180);
}
