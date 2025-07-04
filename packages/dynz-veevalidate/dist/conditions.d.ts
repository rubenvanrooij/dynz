import { AndCondition, Condition, EqualsCondition, GreaterThanCondition, IsInCondition, IsNotInCondition, NotEqualsCondition, OrCondition, ValueOrRef } from './types';
export declare function and<T extends Condition>(...conditions: T[]): Pick<AndCondition, 'type'> & {
    conditions: T[];
};
export declare function or<T extends Condition>(...conditions: T[]): Pick<OrCondition, 'type'> & {
    conditions: T[];
};
export declare function eq<T>(path: string, value: ValueOrRef<T>): EqualsCondition<T>;
export declare function neq<T>(path: string, value: ValueOrRef<T>): NotEqualsCondition<T>;
export declare function gt(path: string, value: ValueOrRef<number>): GreaterThanCondition;
export declare function isIn<T>(path: string, value: ValueOrRef<T>[]): IsInCondition<T>;
export declare function isNotIn<T>(path: string, value: ValueOrRef<T>[]): IsNotInCondition<T>;
//# sourceMappingURL=conditions.d.ts.map