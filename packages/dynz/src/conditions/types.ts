import type { Reference } from "../reference/reference";
import type { EnumRules, EnumValues } from "../schemas";
import type { ValueType } from "../types";

export const ConditionType = {
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

export type ConditionType = EnumValues<typeof ConditionType>;

export type ConditionValue = ValueType | undefined | Reference | Func;

export type AndCondition<T extends Condition[] = never> = {
  type: typeof ConditionType.AND;
  conditions: [T] extends [never] ? Condition[] : T;
};

export type OrCondition<T extends Condition[] = never> = {
  type: typeof ConditionType.OR;
  conditions: [T] extends [never] ? Condition[] : T;
};

export type EqualsCondition<T extends ConditionValue = ConditionValue, V extends ConditionValue = ConditionValue> = {
  type: typeof ConditionType.EQUALS;
  left: T;
  right: V;
};

export type NotEqualsCondition<T extends ConditionValue = ConditionValue, V extends ConditionValue = ConditionValue> = {
  type: typeof ConditionType.NOT_EQUALS;
  left: T;
  right: V;
};

export type MatchesCondition<T extends ConditionValue = ConditionValue> = {
  type: typeof ConditionType.MATCHES;
  left: T;
  right: string;
  flags?: string | undefined;
};

export type GreaterThanCondition<
  T extends ConditionValue = ConditionValue,
  V extends ConditionValue = ConditionValue,
> = {
  type: typeof ConditionType.GREATHER_THAN;
  left: T;
  right: V;
};

export type GreaterThanOrEqualCondition<
  T extends ConditionValue = ConditionValue,
  V extends ConditionValue = ConditionValue,
> = {
  type: typeof ConditionType.GREATHER_THAN_OR_EQUAL;
  left: T;
  right: V;
};

export type LowerThanCondition<T extends ConditionValue = ConditionValue, V extends ConditionValue = ConditionValue> = {
  type: typeof ConditionType.LOWER_THAN;
  left: T;
  right: V;
};

export type LowerThanOrEqualCondition<
  T extends ConditionValue = ConditionValue,
  V extends ConditionValue = ConditionValue,
> = {
  type: typeof ConditionType.LOWER_THAN_OR_EQUAL;
  left: T;
  right: V;
};

export type IsInCondition<
  T extends ConditionValue = ConditionValue,
  V extends Array<ConditionValue> = Array<ConditionValue>,
> = {
  type: typeof ConditionType.IS_IN;
  left: T;
  right: V;
};

export type IsNotInCondition<
  T extends ConditionValue = ConditionValue,
  V extends Array<ConditionValue> = Array<ConditionValue>,
> = {
  type: typeof ConditionType.IS_NOT_IN;
  left: T;
  right: V;
};

export type Condition =
  | EqualsCondition
  | NotEqualsCondition
  | AndCondition
  | OrCondition
  | GreaterThanCondition
  | GreaterThanOrEqualCondition
  | LowerThanCondition
  | LowerThanOrEqualCondition
  | MatchesCondition
  | IsInCondition
  | IsNotInCondition;

export type RulesDependencyMap = {
  dependencies: Record<string, Set<string>>;
  reverse: Record<string, Set<string>>;
};

export const FunctionType = {
  ADD: "add",
  MIN: "min",
} as const;

export type FunctionType = EnumValues<typeof FunctionType>;

export type FunctionValue = ValueType | undefined | Reference | Func;

export type Func<
  T extends FunctionType = FunctionType,
  V extends FunctionValue = never,
  A extends FunctionValue = never,
> = {
  _type: "__func__";
  type: T;
  left: [V] extends [never] ? FunctionValue : V;
  right: [A] extends [never] ? FunctionValue : A;
};
