import { andPredicate, andPredicateType } from "./and-predicate";
import { customPredicateType } from "./custom-predicate";
import { equalsPredicate, equalsPredicateType } from "./equals-predicate";
import { greaterThanOrEqualPredicate, greaterThanOrEqualPredicateType } from "./greater-than-or-equal-predicate";
import { greaterThanPredicate, greaterThanPredicateType } from "./greater-than-predicate";
import { isInPredicate, isInPredicateType } from "./is-in-predicate";
import { isNotInPredicate, isNotInPredicateType } from "./is-not-in-predicate";
import { lowerThanOrEqualPredicate, lowerThanOrEqualPredicateType } from "./lower-than-or-equal-predicate";
import { lowerThanPredicate, lowerThanPredicateType } from "./lower-than-predicate";
import { matchesPredicate, matchesPredicateType } from "./matches-predicate";
import { notEqualsPredicate, notEqualsPredicateType } from "./not-equals-predicate";
import { orPredicate, orPredicateType } from "./or-predicate";

export const PREDICATES = {
  [andPredicateType]: andPredicate,
  [customPredicateType]: undefined, // Custom predicates are user-defined
  [equalsPredicateType]: equalsPredicate,
  [greaterThanPredicateType]: greaterThanPredicate,
  [greaterThanOrEqualPredicateType]: greaterThanOrEqualPredicate,
  [isInPredicateType]: isInPredicate,
  [isNotInPredicateType]: isNotInPredicate,
  [lowerThanPredicateType]: lowerThanPredicate,
  [lowerThanOrEqualPredicateType]: lowerThanOrEqualPredicate,
  [matchesPredicateType]: matchesPredicate,
  [notEqualsPredicateType]: notEqualsPredicate,
  [orPredicateType]: orPredicate,
} as const;
