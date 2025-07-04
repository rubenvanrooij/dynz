import { Condition, ConditionalRule, EqualsRule, MaxRule, MinRule, Reference, RegexRule, Rule, DateString, ValueOrRef, IsNumericRule, CustomRule } from './types';
export declare function rules<T extends Rule>(...rules: T[]): T[];
export declare function ref<const T extends string>(path: T): Reference<T>;
export declare function min<T extends number | DateString | Reference = number | DateString | Reference>(min: T): MinRule<T>;
export declare function max<T extends number | DateString | Reference = number | DateString | Reference>(max: T): MaxRule<T>;
export declare function regex(regex: string): RegexRule;
export declare function equals<T extends ValueOrRef>(value: T): EqualsRule<T>;
export declare function isNumeric(): IsNumericRule;
export declare function custom<T extends Record<string, ValueOrRef>>(name: string, params?: T): CustomRule;
export declare function conditional<T extends Rule>({ when, then, }: {
    when: Condition;
    then: Exclude<T, ConditionalRule<never>>;
}): ConditionalRule<T>;
//# sourceMappingURL=rules.d.ts.map