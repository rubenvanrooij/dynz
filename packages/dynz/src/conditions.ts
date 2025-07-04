import {
  AndCondition,
  Condition,
  ConditionType,
  EqualsCondition,
  GreaterThanCondition,
  GreaterThanOrEqualCondition,
  IsInCondition,
  IsNotInCondition,
  LowerThanCondition,
  LowerThanOrEqualCondition,
  MatchesCondition,
  NotEqualsCondition,
  OrCondition,
  ValueOrRef,
  ValueType,
} from './types';

export function and<const T extends Condition[]>(
  ...conditions: T
): Pick<AndCondition, 'type'> & { conditions: T } {
  return {
    type: ConditionType.AND,
    conditions,
  };
}

export function or<const T extends Condition[]>(
  ...conditions: T
): Pick<OrCondition, 'type'> & { conditions: T } {
  return {
    type: ConditionType.OR,
    conditions,
  };
}

export function eq<const T extends string, const V extends ValueType>(
  path: T,
  value: ValueOrRef<V>,
): EqualsCondition<T, V> {
  return {
    type: ConditionType.EQUALS,
    path,
    value,
  };
}

export function neq<const T extends string, const V extends ValueType>(
  path: T,
  value: ValueOrRef<V>,
): NotEqualsCondition<T, V> {
  return {
    type: ConditionType.NOT_EQUALS,
    path,
    value,
  };
}

export function gt<const T extends string, const V extends number | string>(
  path: T,
  value: ValueOrRef<V>,
): GreaterThanCondition<T, V> {
  return {
    type: ConditionType.GREATHER_THAN,
    path,
    value,
  };
}

export function gte<const T extends string, const V extends number>(
  path: T,
  value: ValueOrRef<V>,
): GreaterThanOrEqualCondition<T, V> {
  return {
    type: ConditionType.GREATHER_THAN_OR_EQUAL,
    path,
    value,
  };
}

export function lt<const T extends string, const V extends number>(
  path: T,
  value: ValueOrRef<V>,
): LowerThanCondition<T, V> {
  return {
    type: ConditionType.LOWER_THAN,
    path,
    value,
  };
}

export function lte<const T extends string, const V extends number>(
  path: T,
  value: ValueOrRef<V>,
): LowerThanOrEqualCondition<T, V> {
  return {
    type: ConditionType.LOWER_THAN_OR_EQUAL,
    path,
    value,
  };
}

export function matches<const T extends string>(
  path: T,
  value: string,
): MatchesCondition<T> {
  return {
    type: ConditionType.MATCHES,
    path,
    value,
  };
}

export function isIn<const T extends string, const V extends ValueType>(
  path: T,
  value: ValueOrRef<V>[],
): IsInCondition<T, V> {
  return {
    type: ConditionType.IS_IN,
    path,
    value,
  };
}

export function isNotIn<const T extends string, const V extends ValueType>(
  path: T,
  value: ValueOrRef<V>[],
): IsNotInCondition<T, V> {
  return {
    type: ConditionType.IS_NOT_IN,
    path,
    value,
  };
}
