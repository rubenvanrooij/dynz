import { ageFunction, ageFunctionType } from "./age-function";
import { ceilFunction, ceilFunctionType } from "./ceil-function";
import { cosFunction, cosFunctionType } from "./cos-function";
import { divideFunction, divideFunctionType } from "./divide-function";
import { floorFunction, floorFunctionType } from "./floor-function";
import { multiplyFunction, multiplyFunctionType } from "./multiply-function";
import { sinFunction, sinFunctionType } from "./sin-function";
import { sizeFunction, sizeFunctionType } from "./size-function";
import { subFunction, subFunctionType } from "./sub-function";
import { sumFunction, sumFunctionType } from "./sum-function";
import { tanFunction, tanFunctionType } from "./tan-function";

export const TRANSFORMERS = {
  [ceilFunctionType]: ceilFunction,
  [cosFunctionType]: cosFunction,
  [floorFunctionType]: floorFunction,
  [sinFunctionType]: sinFunction,
  [sizeFunctionType]: sizeFunction,
  [tanFunctionType]: tanFunction,
  [sumFunctionType]: sumFunction,
  [divideFunctionType]: divideFunction,
  [ageFunctionType]: ageFunction,
  [subFunctionType]: subFunction,
  [multiplyFunctionType]: multiplyFunction,
} as const;
