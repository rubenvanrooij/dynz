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

export const OperatorType = {
  PLUS: "+",
  MINUS: "-",
  MULTIPLY: "*",
  DIVIDE: "/",
  MODULO: "%",
} as const;

export type Operator<
  T extends ValueType | Reference | Operator = never,
  A extends ValueType | Reference | Operator = never,
> = {
  _type: "__dop";
  type:
    | typeof OperatorType.PLUS
    | typeof OperatorType.MINUS
    | typeof OperatorType.MULTIPLY
    | typeof OperatorType.DIVIDE
    | typeof OperatorType.MODULO;
  left: [T] extends [never] ? ValueType | Reference | Operator : T;
  right: [A] extends [never] ? ValueType | Reference | Operator : A;
};

type ConditionInput = ValueType | undefined | Reference | Operator;

export type ConditionType = EnumValues<typeof ConditionType>;

export type AndCondition<T extends Condition[] = never> = {
  type: typeof ConditionType.AND;
  conditions: [T] extends [never] ? Condition[] : T;
};

export type OrCondition<T extends Condition[] = never> = {
  type: typeof ConditionType.OR;
  conditions: [T] extends [never] ? Condition[] : T;
};

export type EqualsCondition<T extends string = string, V extends ConditionInput = ConditionInput> = {
  type: typeof ConditionType.EQUALS;
  path: T;
  value: V;
};

export type NotEqualsCondition<T extends string = string, V extends ConditionInput = ConditionInput> = {
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
  V extends number | string | Reference | Operator = number | string | Reference | Operator,
> = {
  type: typeof ConditionType.GREATHER_THAN;
  path: T;
  value: V;
};

export type GreaterThanOrEqualCondition<
  T extends string | Operator = string | Operator,
  V extends number | Reference | Operator = number | Reference | Operator,
> = {
  type: typeof ConditionType.GREATHER_THAN_OR_EQUAL;
  path: T;
  value: V;
};

export type LowerThanCondition<
  T extends string = string,
  V extends number | Reference | Operator = number | Reference | Operator,
> = {
  type: typeof ConditionType.LOWER_THAN;
  path: T;
  value: V;
};

export type LowerThanOrEqualCondition<
  T extends string = string,
  V extends number | Reference | Operator = number | Reference | Operator,
> = {
  type: typeof ConditionType.LOWER_THAN_OR_EQUAL;
  path: T;
  value: V;
};

export type IsInCondition<
  T extends string = string,
  V extends Array<ValueType | Reference | Operator> = Array<ValueType | Reference | Operator>,
> = {
  type: typeof ConditionType.IS_IN;
  path: T;
  value: V;
};

export type IsNotInCondition<
  T extends string = string,
  V extends Array<ValueType | Reference | Operator> = Array<ValueType | Reference | Operator>,
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
