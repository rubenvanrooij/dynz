import { ageFunction, ageFunctionType } from "./age-function";
import { atanFunction, atanFunctionType } from "./atan-function";
import { capitalizeFunction, capitalizeFunctionType } from "./capitalize-function";
import { ceilFunction, ceilFunctionType } from "./ceil-function";
import { cosFunction, cosFunctionType } from "./cos-function";
import { divideFunction, divideFunctionType } from "./divide-function";
import { floorFunction, floorFunctionType } from "./floor-function";
import { lookupFunction, lookupFunctionType } from "./lookup-function";
import { lowercaseFunction, lowercaseFunctionType } from "./lowercase-function";
import { maxFunction, maxFunctionType } from "./max-function";
import { minFunction, minFunctionType } from "./min-function";
import { multiplyFunction, multiplyFunctionType } from "./multiply-function";
import { pluckFunction, pluckFunctionType } from "./pluck-function";
import { replaceFunction, replaceFunctionType } from "./replace-function";
import { sinFunction, sinFunctionType } from "./sin-function";
import { sizeFunction, sizeFunctionType } from "./size-function";
import { subFunction, subFunctionType } from "./sub-function";
import { sumFunction, sumFunctionType } from "./sum-function";
import { tanFunction, tanFunctionType } from "./tan-function";
import { trimFunction, trimFunctionType } from "./trim-function";
import { uppercaseFunction, uppercaseFunctionType } from "./uppercase-function";

export const TRANSFORMERS = {
  [atanFunctionType]: atanFunction,
  [ceilFunctionType]: ceilFunction,
  [cosFunctionType]: cosFunction,
  [floorFunctionType]: floorFunction,
  [maxFunctionType]: maxFunction,
  [minFunctionType]: minFunction,
  [sinFunctionType]: sinFunction,
  [sizeFunctionType]: sizeFunction,
  [tanFunctionType]: tanFunction,
  [sumFunctionType]: sumFunction,
  [divideFunctionType]: divideFunction,
  [ageFunctionType]: ageFunction,
  [subFunctionType]: subFunction,
  [multiplyFunctionType]: multiplyFunction,
  [lookupFunctionType]: lookupFunction,
  [pluckFunctionType]: pluckFunction,
  [trimFunctionType]: trimFunction,
  [uppercaseFunctionType]: uppercaseFunction,
  [lowercaseFunctionType]: lowercaseFunction,
  [capitalizeFunctionType]: capitalizeFunction,
  [replaceFunctionType]: replaceFunction,
} as const;
