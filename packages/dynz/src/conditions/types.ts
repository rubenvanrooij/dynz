import type { Reference } from "../reference/reference";
import type { EnumValues } from "../schemas";
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

export type AndCondition<T extends Condition[] = never> = {
  type: typeof ConditionType.AND;
  conditions: [T] extends [never] ? Condition[] : T;
};

export type OrCondition<T extends Condition[] = never> = {
  type: typeof ConditionType.OR;
  conditions: [T] extends [never] ? Condition[] : T;
};

export type EqualsCondition<
  T extends string = string,
  V extends ValueType | undefined | Reference = ValueType | undefined | Reference,
> = {
  type: typeof ConditionType.EQUALS;
  path: T;
  value: V;
};

export type NotEqualsCondition<
  T extends string = string,
  V extends ValueType | undefined | Reference = ValueType | undefined | Reference,
> = {
  type: typeof ConditionType.NOT_EQUALS;
  path: T;
  value: V;
};

export type MatchesCondition<T extends string = string> = {
  type: typeof ConditionType.MATCHES;
  path: T;
  value: string;
  flags?: string | undefined;
};

export type GreaterThanCondition<
  T extends string = string,
  V extends number | string | Reference = number | string | Reference,
> = {
  type: typeof ConditionType.GREATHER_THAN;
  path: T;
  value: V;
};

export type GreaterThanOrEqualCondition<
  T extends string = string,
  V extends number | Reference = number | Reference,
> = {
  type: typeof ConditionType.GREATHER_THAN_OR_EQUAL;
  path: T;
  value: V;
};

export type LowerThanCondition<T extends string = string, V extends number | Reference = number | Reference> = {
  type: typeof ConditionType.LOWER_THAN;
  path: T;
  value: V;
};

export type LowerThanOrEqualCondition<T extends string = string, V extends number | Reference = number | Reference> = {
  type: typeof ConditionType.LOWER_THAN_OR_EQUAL;
  path: T;
  value: V;
};

export type IsInCondition<
  T extends string = string,
  V extends Array<ValueType | Reference> = Array<ValueType | Reference>,
> = {
  type: typeof ConditionType.IS_IN;
  path: T;
  value: V;
};

export type IsNotInCondition<
  T extends string = string,
  V extends Array<ValueType | Reference> = Array<ValueType | Reference>,
> = {
  type: typeof ConditionType.IS_NOT_IN;
  path: T;
  value: V;
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
