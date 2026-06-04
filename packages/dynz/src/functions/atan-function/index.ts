import type { ToParam } from "../../schemas";
import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import { isNumber } from "../../validate/validate-type";
import { val } from "../builders";
import type { ParamaterValue } from "../types";

export const atanFunctionType = "atan";

export type AtanFunction<TValue extends ParamaterValue = never> = {
  type: typeof atanFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates an arctangent transformer that calculates the arctangent of a value, returning degrees.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The arctangent transformer applies the mathematical arctangent function to the input value
 * and returns the result in degrees.
 *
 * @category Transformer
 * @param value - The tangent ratio (reference, static value, or another transformer)
 * @returns A Transformer that computes atan(value) in degrees
 *
 * @example
 * // Calculate the angle from a slope ratio
 * atan(ref('slopeRatio'))
 *
 * @example
 * // Check if the resulting angle exceeds a threshold
 * gt(atan(ref('gradient')), v(45))
 *
 * @see {@link tan} - Tangent transformer
 * @see {@link sin} - Sine transformer
 * @see {@link cos} - Cosine transformer
 */
export function atan<const T extends ParamaterValue<number> | number>(value: T): AtanFunction<ToParam<T>> {
  return {
    type: atanFunctionType,
    value: (isNumber(value) ? val(value) : value) as ToParam<T>,
  };
}

export function atanFunction(value: ValueType | undefined): number {
  return (Math.atan(coerceNumber(value)) * 180) / Math.PI;
}
