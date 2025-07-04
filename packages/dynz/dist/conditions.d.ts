import { AndCondition, Condition, EqualsCondition, GreaterThanCondition, GreaterThanOrEqualCondition, IsInCondition, IsNotInCondition, LowerThanCondition, LowerThanOrEqualCondition, MatchesCondition, NotEqualsCondition, OrCondition, ValueOrRef, ValueType } from './types';
export declare function and<const T extends Condition[]>(...conditions: T): Pick<AndCondition, 'type'> & {
    conditions: T;
};
export declare function or<const T extends Condition[]>(...conditions: T): Pick<OrCondition, 'type'> & {
    conditions: T;
};
export declare function eq<const T extends string, const V extends ValueType>(path: T, value: ValueOrRef<V>): EqualsCondition<T, V>;
export declare function neq<const T extends string, const V extends ValueType>(path: T, value: ValueOrRef<V>): NotEqualsCondition<T, V>;
export declare function gt<const T extends string, const V extends number | string>(path: T, value: ValueOrRef<V>): GreaterThanCondition<T, V>;
export declare function gte<const T extends string, const V extends number>(path: T, value: ValueOrRef<V>): GreaterThanOrEqualCondition<T, V>;
export declare function lt<const T extends string, const V extends number>(path: T, value: ValueOrRef<V>): LowerThanCondition<T, V>;
export declare function lte<const T extends string, const V extends number>(path: T, value: ValueOrRef<V>): LowerThanOrEqualCondition<T, V>;
export declare function matches<const T extends string>(path: T, value: string): MatchesCondition<T>;
export declare function isIn<const T extends string, const V extends ValueType>(path: T, value: ValueOrRef<V>[]): IsInCondition<T, V>;
export declare function isNotIn<const T extends string, const V extends ValueType>(path: T, value: ValueOrRef<V>[]): IsNotInCondition<T, V>;
//# sourceMappingURL=conditions.d.ts.map