// import type { Reference } from "../reference";
import type { EnumValues } from "../schemas";
import type { ValueType } from "../types";

export type Static<T extends ValueType = ValueType> = {
  type: "static";
  value: T;
};

export type Reference<T extends string = string> = {
  type: "ref";
  path: T;
};

export type ParamaterValue = Static | undefined | Reference | Predicate | Transformer;

/**
 * Predicate types available in Dynz
 */
export const PredicateType = {
  OR: "or",
  AND: "and",
  EQUALS: "eq",
  NOT_EQUALS: "neq",
  GREATHER_THAN: "gt",
  GREATHER_THAN_OR_EQUAL: "gte",
  LOWER_THAN: "lt",
  LOWER_THAN_OR_EQUAL: "lte",
  MATCHES: "matches",
  IS_IN: "in",
  IS_NOT_IN: "nin",
} as const;

export type PredicateType = EnumValues<typeof PredicateType>;

export type DefaultPredicateType = Exclude<
  PredicateType,
  typeof PredicateType.OR | typeof PredicateType.AND | typeof PredicateType.MATCHES
>;

export type DefaultPredicate<
  T extends DefaultPredicateType = DefaultPredicateType,
  TLeft extends ParamaterValue = never,
  TRight extends ParamaterValue = never,
> = {
  type: T;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

export type CombinatorPredicateType = typeof PredicateType.OR | typeof PredicateType.AND;

export type CombinatorPredicate<
  T extends CombinatorPredicateType = CombinatorPredicateType,
  TPredicate extends Predicate = never,
> = {
  type: T;
  predicates: [TPredicate] extends [never] ? Predicate[] : TPredicate[];
};

export type MatchesPredicate<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof PredicateType.MATCHES;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
  flags?: string | undefined;
};

export type Predicate = DefaultPredicate | CombinatorPredicate | MatchesPredicate;

/**
 * Functions available in dynz
 */
export const TransformerType = {
  SUM: "sum",
  SUB: "sub",
  MULTIPLY: "multiply",
  DIVIDE: "divide",
  DAYS: "days",
  SIZE: "size",
} as const;

export type TransformerType = EnumValues<typeof TransformerType>;

export type LeftRightTransformerType =
  | typeof TransformerType.SUM
  | typeof TransformerType.SUB
  | typeof TransformerType.MULTIPLY
  | typeof TransformerType.DIVIDE;

export type LeftRightTransformer<
  T extends LeftRightTransformerType = LeftRightTransformerType,
  TLeft extends ParamaterValue = never,
  TRight extends ParamaterValue = never,
> = {
  type: T;
  // TODO: maybe convert to array?
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

export type SizeTransformer<TValue extends ParamaterValue = never> = {
  type: typeof TransformerType.SIZE;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

export type Transformer = LeftRightTransformer | SizeTransformer;

export type Func = Transformer | Predicate;
