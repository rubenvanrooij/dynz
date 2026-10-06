import { andFunction, andFunctionType } from "./and-function";
import { equalsFunction, equalsFunctionType } from "./equals-function";
import { greaterThanFunction, greaterThanFunctionType } from "./greater-than-function";
import { greaterThanOrEqualFunction, greaterThanOrEqualFunctionType } from "./greater-than-or-equal-function";
import { isBoundaryDayFunction, isBoundaryDayFunctionType } from "./is-boundary-day-function";
import { isInFunction, isInFunctionType } from "./is-in-function";
import { isNotInFunction, isNotInFunctionType } from "./is-not-in-function";
import { lowerThanFunction, lowerThanFunctionType } from "./lower-than-function";
import { lowerThanOrEqualFunction, lowerThanOrEqualFunctionType } from "./lower-than-or-equal-function";
import { matchesFunction, matchesFunctionType } from "./matches-function";
import { notEqualsFunction, notEqualsFunctionType } from "./not-equals-function";
import { orFunction, orFunctionType } from "./or-function";
import { sameCalendarFunction, sameCalendarFunctionType } from "./same-calendar-function";

export const PREDICATES = {
  [andFunctionType]: andFunction,
  // [customFunctionType]: undefined, // Custom predicates are user-defined
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
  [sameCalendarFunctionType]: sameCalendarFunction,
  [isBoundaryDayFunctionType]: isBoundaryDayFunction,
} as const;
