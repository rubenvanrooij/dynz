import { Condition, ConditionalRule, EqualsRule, MaxRule, MinRule, Reference, RegexRule, Rule, StaticValue, DateString, ValueOrRef } from './types';
export declare function rules<T extends Rule>(...rules: T[]): T[];
export declare function val<const T>(value: T): StaticValue<T>;
export declare function ref<const T extends string>(path: T): Reference<T>;
export declare function min<T extends number | DateString = number | DateString>(min: T | Reference): MinRule<T>;
export declare function max<T extends number | DateString = number | DateString>(max: T | Reference): MaxRule<T>;
export declare function regex(regex: string): RegexRule;
export declare function equals<T extends ValueOrRef>(value: T): EqualsRule<T>;
export declare function conditional<T extends Rule>({ when, then, }: {
    when: Condition;
    then: Exclude<T, ConditionalRule<never>>;
}): ConditionalRule<T>;
//# sourceMappingURL=rules.d.ts.map