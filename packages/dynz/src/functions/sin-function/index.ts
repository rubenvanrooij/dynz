import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const sinFunctionType = "sin";

export type SinFunction<TValue extends ParamaterValue = never> = {
  type: typeof sinFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates a sine transformer that calculates the sine of a value (in degrees).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The sine transformer applies the mathematical sine function to the input value.
 *
 * @category Transformer
 * @param value - The angle in degrees (reference, static value, or another transformer)
 * @returns A Transformer that computes sin(value)
 *
 * @example
 * // Calculate the sine of an angle field
 * sin(ref('angleInDegrees'))
 *
 * @example
 * // Use in a predicate to check sine value bounds
 * gte(sin(ref('rotation')), v(-1))
 *
 * @example
 * // Combine with other transformers
 * sum(sin(ref('angle')), cos(ref('angle')))
 *
 * @see {@link cos} - Cosine transformer
 * @see {@link tan} - Tangent transformer
 */
export function sin<const T extends ParamaterValue>(value: T): SinFunction<T> {
  return {
    type: sinFunctionType,
    value,
  };
}

export function sinFunction(value: ValueType | undefined): number {
  return Math.sin((coerceNumber(value) * Math.PI) / 180);
}
