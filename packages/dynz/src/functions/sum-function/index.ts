import { type ToParam, type ToParams, toParamaterValues } from "../../schemas";
import type { ValueType } from "../../types";
import { coerceNumber } from "../../utils";
import type { ParamaterValue } from "../types";

export const sumFunctionType = "sum";

export type SumFunction<TValue extends ParamaterValue[] = never> = {
  type: typeof sumFunctionType;
  value: [TValue] extends [never] ? ParamaterValue[] : TValue;
};

/**
 * Creates an addition transformer.
 *
 * Accepts a single value, an array of values, or variadic arguments.
 *
 * @category Transformer
 *
 * @example
 * // Variadic
 * sum(ref('margin'), ref('commission'))
 *
 * @example
 * // Array argument
 * sum([ref('a'), ref('b'), 5])
 *
 * @example
 * // Single value
 * sum(ref('total'))
 *
 * @see {@link sub} - Subtraction transformer
 * @see {@link multiply} - Multiplication transformer
 * @see {@link divide} - Division transformer
 */
export function sum<const T extends ParamaterValue<number> | number>(value: T): SumFunction<[ToParam<T>]>;
export function sum<const T extends (ParamaterValue<number> | number)[]>(value: T): SumFunction<ToParams<T>>;
export function sum<const T extends (ParamaterValue<number> | number)[]>(...value: T): SumFunction<ToParams<T>>;
export function sum(...args: (ParamaterValue<number> | number | (ParamaterValue<number> | number)[])[]): SumFunction {
  if (args.length === 1 && Array.isArray(args[0])) {
    return { type: sumFunctionType, value: toParamaterValues(args[0]) };
  }
  return { type: sumFunctionType, value: toParamaterValues(args as (ParamaterValue<number> | number)[]) };
}

export function sumFunction(value: Array<ValueType | undefined>): number {
  return value?.reduce<number>((acc, cur) => acc + coerceNumber(cur), 0);
}
