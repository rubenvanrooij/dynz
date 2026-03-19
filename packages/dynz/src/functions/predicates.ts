import { andFunction, andFunctionType } from "./and-function";
import { customFunctionType } from "./custom-function";
import { equalsFunction, equalsFunctionType } from "./equals-function";
import { greaterThanOrEqualFunction, greaterThanOrEqualFunctionType } from "./greater-than-or-equal-function";
import { greaterThanFunction, greaterThanFunctionType } from "./greater-than-function";
import { isInFunction, isInFunctionType } from "./is-in-function";
import { isNotInFunction, isNotInFunctionType } from "./is-not-in-function";
import { lowerThanOrEqualFunction, lowerThanOrEqualFunctionType } from "./lower-than-or-equal-function";
import { lowerThanFunction, lowerThanFunctionType } from "./lower-than-function";
import { matchesFunction, matchesFunctionType } from "./matches-function";
import { notEqualsFunction, notEqualsFunctionType } from "./not-equals-function";
import { orFunction, orFunctionType } from "./or-function";

export const PREDICATES = {
  [andFunctionType]: andFunction,
  [customFunctionType]: undefined, // Custom predicates are user-defined
  [equalsFunctionType]: equalsFunction,
  [greaterThanFunctionType]: greaterThanFunction,
  [greaterThanOrEqualFunctionType]: greaterThanOrEqualFunction,
  [isInFunctionType]: isInFunction,
  [isNotInFunctionType]: isNotInFunction,
  [lowerThanFunctionType]: lowerThanFunction,
  [lowerThanOrEqualFunctionType]: lowerThanOrEqualFunction,
  [matchesFunctionType]: matchesFunction,
  [notEqualsFunctionType]: notEqualsFunction,
  [orFunctionType]: orFunction,
} as const;
