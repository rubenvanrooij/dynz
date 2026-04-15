import type { ToParam } from "../../schemas";
import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import { isNumber } from "../../validate/validate-type";
import { val } from "../builders";
import type { ParamaterValue } from "../types";

export const tanFunctionType = "tan";

export type TanFunction<TValue extends ParamaterValue = never> = {
  type: typeof tanFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates a tangent transformer that calculates the tangent of a value (in degrees).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The tangent transformer applies the mathematical tangent function to the input value.
 *
 * @category Transformer
 * @param value - The angle in degrees (reference, static value, or another transformer)
 * @returns A Transformer that computes tan(value)
 *
 * @example
 * // Calculate the tangent of an angle field
 * tan(ref('angleInDegrees'))
 *
 * @example
 * // Use in slope calculations
 * gt(tan(ref('incline')), v(1))
 *
 * @see {@link sin} - Sine transformer
 * @see {@link cos} - Cosine transformer
 */
export function tan<const T extends ParamaterValue<number> | number>(value: T): TanFunction<ToParam<T>> {
  return {
    type: tanFunctionType,
    value: (isNumber(value) ? val(value) : value) as ToParam<T>,
  };
}

export function tanFunction(value: ValueType | undefined): number {
  return Math.sin((coerceNumber(value) * Math.PI) / 180);
}
