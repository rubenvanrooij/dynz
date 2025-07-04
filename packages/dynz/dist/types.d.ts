export type EnumValues<T> = T[keyof T];
export type Unpacked<T> = T extends (infer U)[] ? U : T;
export type Filter<T extends unknown[], A> = T extends [] ? [] : T extends [infer H, ...infer R] ? H extends A ? Filter<R, A> : [H, ...Filter<R, A>] : T;
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]-?: DeepPartial<T[P]>;
} : T;
export type DateString = string;
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type JsonPrimitive = string | number | boolean;
export declare const RuleType: {
    readonly MIN: "min";
    readonly MAX: "max";
    readonly MAX_PRECISION: "max_precision";
    readonly REGEX: "regex";
    readonly EQUALS: "equals";
    readonly CONDITIONAL: "conditional";
    readonly IS_NUMERIC: "is_numeric";
    readonly CUSTOM: "custom";
};
export type RuleType = EnumValues<typeof RuleType>;
export type Default<T, A> = [T] extends [never] ? A : T;
export type IsNumericRule = {
    type: typeof RuleType.IS_NUMERIC;
};
export type MinRule<T extends number | string | Reference = number | string | Reference> = {
    type: typeof RuleType.MIN;
    min: T;
};
export type MaxRule<T extends number | string | Reference = number | string | Reference> = {
    type: typeof RuleType.MAX;
    max: T;
};
export type MaxPrecisionRule = {
    type: typeof RuleType.MAX_PRECISION;
    max: ValueOrRef<number>;
};
export type EqualsRule<T extends ValueOrRef = ValueOrRef> = {
    type: typeof RuleType.EQUALS;
    value: T;
};
export type RegexRule = {
    type: typeof RuleType.REGEX;
    regex: string;
};
export type BeforeRule = {
    type: typeof RuleType.REGEX;
    before: ValueOrRef<Date>;
};
export type AfterRule = {
    type: typeof RuleType.REGEX;
    after: ValueOrRef<Date>;
};
export type CustomRule<T extends Record<string, ValueOrRef> = Record<string, ValueOrRef>> = {
    type: typeof RuleType.CUSTOM;
    name: string;
    params: T;
};
export type ConditionalRule<TRule extends Rule> = {
    type: typeof RuleType.CONDITIONAL;
    when: Condition;
    then: Exclude<[TRule] extends [never] ? Rule : TRule, ConditionalRule<never>>;
};
export type Rule = ConditionalRule<never> | MinRule | MaxRule | EqualsRule | RegexRule | MaxPrecisionRule | IsNumericRule | CustomRule;
/**
 *
 *
 * REFERENCES
 *
 *
 */
export type Reference<T extends string = string> = {
    type: '__reference';
    readonly path: T;
};
export type ValueOrRef<T extends ValueType | Reference = ValueType | Reference> = T;
/**
 *
 *
 * CONDITIONS
 *
 *
 */
export declare const ConditionType: {
    readonly OR: "or";
    readonly AND: "and";
    readonly EQUALS: "eq";
    readonly NOT_EQUALS: "neq";
    readonly GREATHER_THAN: "gt";
    readonly GREATHER_THAN_OR_EQUAL: "gte";
    readonly LOWER_THAN: "lt";
    readonly LOWER_THAN_OR_EQUAL: "lte";
    readonly MATCHES: "matches";
    readonly IS_IN: "in";
    readonly IS_NOT_IN: "nin";
};
export type ConditionType = EnumValues<typeof ConditionType>;
export type AndCondition<T extends Condition[] = never> = {
    type: typeof ConditionType.AND;
    conditions: [T] extends [never] ? Condition[] : T;
};
export type OrCondition<T extends Condition[] = never> = {
    type: typeof ConditionType.OR;
    conditions: [T] extends [never] ? Condition[] : T;
};
export type EqualsCondition<T extends string = string, V extends ValueType = ValueType> = {
    type: typeof ConditionType.EQUALS;
    path: T;
    value: ValueOrRef<V>;
};
export type NotEqualsCondition<T extends string = string, V extends ValueType = ValueType> = {
    type: typeof ConditionType.NOT_EQUALS;
    path: T;
    value: ValueOrRef<V>;
};
export type MatchesCondition<T extends string = string> = {
    type: typeof ConditionType.MATCHES;
    path: T;
    value: string;
};
export type GreaterThanCondition<T extends string = string, V extends number | string = number | string> = {
    type: typeof ConditionType.GREATHER_THAN;
    path: T;
    value: ValueOrRef<V>;
};
export type GreaterThanOrEqualCondition<T extends string = string, V extends number = number> = {
    type: typeof ConditionType.GREATHER_THAN_OR_EQUAL;
    path: T;
    value: ValueOrRef<V>;
};
export type LowerThanCondition<T extends string = string, V extends number = number> = {
    type: typeof ConditionType.LOWER_THAN;
    path: T;
    value: ValueOrRef<V>;
};
export type LowerThanOrEqualCondition<T extends string = string, V extends number = number> = {
    type: typeof ConditionType.LOWER_THAN_OR_EQUAL;
    path: T;
    value: ValueOrRef<V>;
};
export type IsInCondition<T extends string = string, V extends ValueType = ValueType> = {
    type: typeof ConditionType.IS_IN;
    path: T;
    value: ValueOrRef<V>[];
};
export type IsNotInCondition<T extends string = string, V extends ValueType = ValueType> = {
    type: typeof ConditionType.IS_NOT_IN;
    path: T;
    value: ValueOrRef<V>[];
};
export type Condition = EqualsCondition | NotEqualsCondition | AndCondition | OrCondition | GreaterThanCondition | GreaterThanOrEqualCondition | LowerThanCondition | LowerThanOrEqualCondition | MatchesCondition | IsInCondition | IsNotInCondition;
/**
 *
 *
 * SCHEMAS
 *
 *
 */
export declare const SchemaType: {
    readonly STRING: "string";
    readonly DATE: "date";
    readonly DATE_STRING: "date_string";
    readonly NUMBER: "number";
    readonly OBJECT: "object";
    readonly ARRAY: "array";
    readonly OPTIONS: "options";
};
export type SchemaType = EnumValues<typeof SchemaType>;
export type BaseSchema<TValue, TType extends SchemaType, TRule extends Rule> = {
    type: TType;
    rules?: Array<TRule | ConditionalRule<TRule>>;
    default?: TValue;
    required?: boolean | Condition;
    mutable?: boolean | Condition;
    included?: boolean | Condition;
    private?: boolean;
};
export type PrivateSchema = {
    private?: boolean;
};
/**
 * STRING SCHEMA
 */
export type StringRules = RegexRule | MinRule<number | Reference> | MaxRule<number | Reference> | EqualsRule | IsNumericRule | CustomRule;
export type StringSchema<TRule extends StringRules = StringRules> = BaseSchema<string, typeof SchemaType.STRING, TRule> & PrivateSchema;
/**
 * STRING DATE SCHEMA
 */
export type DateStringRules = MinRule<DateString | Reference> | MaxRule<DateString | Reference> | EqualsRule<DateString | Reference> | RegexRule | CustomRule;
export type DateStringSchema<TFormat extends string = string, TRule extends DateStringRules = DateStringRules> = BaseSchema<DateString, typeof SchemaType.DATE_STRING, TRule> & PrivateSchema & {
    format: TFormat;
};
/**
 * OPTIONS SCHEMA
 */
export type OptionsRules = EqualsRule | CustomRule;
export type OptionsSchema<TValue extends JsonPrimitive, TRule extends OptionsRules = OptionsRules> = BaseSchema<TValue, typeof SchemaType.OPTIONS, TRule>;
/**
 * OBJECT SCHEMA
 */
export type ObjectRules = CustomRule;
export type ObjectSchema<T extends Record<string, Schema>> = BaseSchema<[
    T
] extends [never] ? Record<string, unknown> : {
    [A in keyof T]: SchemaValues<T[A]>;
}, typeof SchemaType.OBJECT, ObjectRules> & {
    fields: [T] extends [never] ? Record<string, Schema> : T;
};
/**
 * ARRAY SCHEMA
 */
export type ArrayRules = MinRule<number> | MaxRule<number> | CustomRule;
export type ArraySchema<T extends Schema> = BaseSchema<[
    T
] extends [never] ? unknown[] : SchemaValues<T>[], typeof SchemaType.ARRAY, ArrayRules> & {
    schema: [T] extends [never] ? Schema : T;
};
/**
 * NUMBER SCHEMA
 */
export type NumberRules = MinRule<number | Reference> | MaxRule<number | Reference> | MaxPrecisionRule | EqualsRule<number | Reference> | CustomRule;
export type NumberSchema = BaseSchema<number, typeof SchemaType.NUMBER, NumberRules>;
export type Schema = StringSchema | ObjectSchema<never> | NumberSchema | ArraySchema<never> | DateStringSchema | OptionsSchema<JsonPrimitive>;
export type SchemaWithParent<T extends Schema = Schema> = T & {
    parent?: Schema;
    parentValue?: unknown;
};
export type IsIncluded<T extends Schema> = T extends {
    included: unknown;
} ? T['included'] extends true ? true : false : true;
export type IsRequired<T extends Schema> = T extends {
    required: unknown;
} ? T['required'] extends true ? true : false : false;
export type RequiredKeys<T extends ObjectSchema<never>> = {
    [P in keyof T['fields']]: P;
};
export type IsMandatory<T extends Schema> = IsIncluded<T> extends true ? IsRequired<T> : false;
export type EvalOptional<T extends Schema, V> = IsMandatory<T> extends true ? V : V | undefined;
export type Masked<T extends Schema, V> = IsPrivate<T> extends true ? PrivateValue<V> : V;
export type IsPrivate<T extends Schema> = T['private'] extends true ? true : false;
export type ValueType<T extends SchemaType = SchemaType> = T extends typeof SchemaType.STRING ? string : T extends typeof SchemaType.DATE_STRING ? DateString : T extends typeof SchemaType.DATE ? Date : T extends typeof SchemaType.NUMBER ? number : T extends typeof SchemaType.OBJECT ? Record<string, unknown> : T extends typeof SchemaType.ARRAY ? unknown[] : never;
export type SchemaValues<T extends Schema> = Masked<T, T extends StringSchema ? EvalOptional<T, string> : T extends DateStringSchema ? EvalOptional<T, DateString> : T extends NumberSchema ? EvalOptional<T, number> : T extends ObjectSchema<never> ? {
    [A in keyof T['fields']]?: SchemaValues<T['fields'][A]>;
} & {
    [A in keyof T['fields'] as IsMandatory<T['fields'][A]> extends true ? A : IsPrivate<T['fields'][A]> extends true ? A : never]-?: SchemaValues<T['fields'][A]>;
} : T extends ArraySchema<never> ? EvalOptional<T, Array<SchemaValues<T['schema']>>> : never>;
/***
 * RESOLVED SCHEMA
 */
export type ResolvedRules<T extends Rule = Rule> = Exclude<T, ConditionalRule<T>>;
/**
 * CONTEXT
 * being used in resolving and / or validation
 */
export type Context<T extends Schema = Schema> = {
    type: 'validate';
    schema: T;
    /**
     * Will be set to true if current values is not undefined; if
     * current values is undefined, it will be set to false.
     */
    validateOptions: ValidateOptions;
    validateMutable: boolean;
    values: {
        current: unknown;
        new: unknown;
    };
};
/***
 *
 *
 * VALIDATION
 *
 *
 */
export type ValidationSuccesResult<T> = {
    success: true;
    values: T;
};
export declare const ErrorCode: {
    readonly IMMUTABLE: "immutable";
    readonly INCLUDED: "included";
    readonly REQRUIED: "required";
    readonly TYPE: "type";
    readonly MIN: "min";
    readonly MAX: "max";
    readonly MAX_PRECISION: "max_precision";
    readonly REGEX: "regex";
    readonly EQUALS: "equals";
    readonly CONDITIONAL: "conditional";
    readonly IS_NUMERIC: "is_numeric";
    readonly CUSTOM: "custom";
};
export type ErrorCode = EnumValues<typeof ErrorCode>;
export type BaseErrorMessage<T = unknown, A = unknown, S extends Schema = Schema> = {
    path: string;
    message: string;
    schema: S;
    value: T;
    current: A;
};
export type EqualsErrorMessage<T = unknown> = BaseErrorMessage & {
    code: typeof ErrorCode.EQUALS;
    equals: T;
};
export type MinErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.MIN;
    min: number | string;
};
export type MaxErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.MAX;
    max: number | string;
};
export type CustomErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.CUSTOM;
    name: string;
};
export type IsNumericErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.IS_NUMERIC;
};
export type MaxPrecisionErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.MAX_PRECISION;
    maxPrecision: number;
};
export type RegexErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.REGEX;
    regex: string;
};
export type ImmutableErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.IMMUTABLE;
};
export type IncludedErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.INCLUDED;
};
export type RequiredErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.REQRUIED;
};
export type TypeErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.TYPE;
    expectedType: Exclude<SchemaType, typeof SchemaType.DATE_STRING>;
};
export type DateStringTypeErrorMessage = BaseErrorMessage & {
    code: typeof ErrorCode.TYPE;
    expectedType: typeof SchemaType.DATE_STRING;
    expectedFormat: string;
};
export type ErrorMessage = EqualsErrorMessage | MinErrorMessage | MaxErrorMessage | MaxPrecisionErrorMessage | RegexErrorMessage | ImmutableErrorMessage | IncludedErrorMessage | RequiredErrorMessage | TypeErrorMessage | DateStringTypeErrorMessage | IsNumericErrorMessage | CustomErrorMessage;
export type ValidationErrorResult = {
    success: false;
    errors: ErrorMessage[];
};
export type PlainPrivateValue<T> = {
    state: 'plain';
    value?: T;
};
export type MaskedPrivateValue = {
    state: 'masked';
    value: string;
};
export type PrivateValue<T> = PlainPrivateValue<T> | MaskedPrivateValue;
export type ValidationResult<T> = ValidationSuccesResult<T> | ValidationErrorResult;
export type SchemaWithValue<T extends Schema = Schema> = {
    value: ValueType<T['type']>;
    schema: T;
};
export type CustomRuleFunction<TSchema extends Schema = Schema, TParams extends Record<string, unknown> = Record<string, unknown>> = (value: SchemaWithValue<TSchema>, params: TParams, path: string, schema: Schema) => boolean | {
    success: false;
    [key: string]: JsonPrimitive;
};
export type CustomRuleMap = Record<string, CustomRuleFunction>;
export type ValidateOptions<TCustomRuleMap extends CustomRuleMap = CustomRuleMap> = {
    customRules?: TCustomRuleMap;
};
//# sourceMappingURL=types.d.ts.map