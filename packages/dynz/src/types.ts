export type EnumValues<T> = T[keyof T];
export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type Flatten<T> = T extends (infer U)[] ? U : T;

export type Filter<T extends unknown[], A> = T extends []
  ? []
  : T extends [infer H, ...infer R]
    ? H extends A
      ? Filter<R, A>
      : [H, ...Filter<R, A>]
    : T;

export type DateString = string;

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type JsonPrimitive = string | number | boolean;

export const RuleType = {
  MIN: "min",
  MAX: "max",
  AFTER: "after",
  BEFORE: "before",
  EMAIL: "email",
  ONE_OF: "one_off",
  MIME_TYPE: "mime_type",
  MAX_PRECISION: "max_precision",
  REGEX: "regex",
  EQUALS: "equals",
  CONDITIONAL: "conditional",
  IS_NUMERIC: "is_numeric",
  CUSTOM: "custom",
} as const;

export type RuleType = EnumValues<typeof RuleType>;
export type Default<T, A> = [T] extends [never] ? A : T;

export type IsNumericRule = {
  type: typeof RuleType.IS_NUMERIC;
  code?: string | undefined;
};

export type MinRule<T extends number | string | Reference = number | string | Reference> = {
  type: typeof RuleType.MIN;
  min: T;
  code?: string | undefined;
};

export type MaxRule<T extends number | string | Reference = number | string | Reference> = {
  type: typeof RuleType.MAX;
  max: T;
  code?: string | undefined;
};

export type MaxPrecisionRule<T extends number | Reference = number | Reference> = {
  type: typeof RuleType.MAX_PRECISION;
  max: T;
  code?: string | undefined;
};

export type EqualsRule<T extends ValueOrRef = ValueOrRef> = {
  type: typeof RuleType.EQUALS;
  value: T;
  code?: string | undefined;
};

export type EmailRule = {
  type: typeof RuleType.EMAIL;
  code?: string | undefined;
};

export type OneOfRule<T extends ValueOrRef[] = ValueOrRef[]> = {
  type: typeof RuleType.ONE_OF;
  values: T;
  code?: string | undefined;
};

export type RegexRule = {
  type: typeof RuleType.REGEX;
  regex: string;
  code?: string | undefined;
};

export type BeforeRule<T extends string | Reference = string | Reference> = {
  type: typeof RuleType.BEFORE;
  before: T;
  code?: string | undefined;
};

export type AfterRule<T extends string | Reference = string | Reference> = {
  type: typeof RuleType.AFTER;
  after: T;
  code?: string | undefined;
};

export type MimeTypeRule = {
  type: typeof RuleType.MIME_TYPE;
  mimeType: ValueOrRef<string[] | string>;
  code?: string | undefined;
};

export type CustomRule<T extends Record<string, ValueOrRef> = Record<string, ValueOrRef>> = {
  type: typeof RuleType.CUSTOM;
  name: string;
  params: T;
  code?: string | undefined;
};

export type ConditionalRule<TCondition, TRule extends Rule> = {
  type: typeof RuleType.CONDITIONAL;
  when: [TCondition] extends [never] ? Condition : TCondition;
  then: Exclude<[TRule] extends [never] ? Rule : TRule, ConditionalRule<never, never>>;
  code?: string | undefined;
};

export type Rule =
  | ConditionalRule<never, never>
  | MinRule
  | MaxRule
  | EqualsRule
  | RegexRule
  | MaxPrecisionRule
  | IsNumericRule
  | CustomRule
  | MimeTypeRule
  | OneOfRule
  | EmailRule
  | BeforeRule
  | AfterRule;

/**
 *
 *
 * REFERENCES
 *
 *
 */
export type Reference<T extends string = string> = {
  type: "__reference";
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

// type Condition = {
//     path: string
//     operator:
// }

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

export type EqualsCondition<T extends string = string, V extends ValueType | Reference = ValueType | Reference> = {
  type: typeof ConditionType.EQUALS;
  path: T;
  value: V;
};

export type NotEqualsCondition<T extends string = string, V extends ValueType | Reference = ValueType | Reference> = {
  type: typeof ConditionType.NOT_EQUALS;
  path: T;
  value: V;
};

export type MatchesCondition<T extends string = string> = {
  type: typeof ConditionType.MATCHES;
  path: T;
  value: string;
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

/**
 *
 *
 * SCHEMAS
 *
 *
 */

export const SchemaType = {
  STRING: "string",
  DATE: "date",
  DATE_STRING: "date_string",
  NUMBER: "number",
  OBJECT: "object",
  ARRAY: "array",
  OPTIONS: "options",
  BOOLEAN: "boolean",
  FILE: "file",
} as const;

export type SchemaType = EnumValues<typeof SchemaType>;

export type BaseSchema<TValue, TType extends SchemaType, TRule extends Rule> = {
  type: TType;
  rules?: Array<TRule | ConditionalRule<Condition, Rule>>;
  default?: TValue;
  required?: boolean | Condition;
  mutable?: boolean | Condition;
  included?: boolean | Condition;
  private?: boolean;
};

// TODO: Remove this?
export type PrivateSchema = {
  private?: boolean;
};

/**
 * STRING SCHEMA
 */
export type StringRules =
  | RegexRule
  | MinRule<number | Reference>
  | MaxRule<number | Reference>
  | EqualsRule
  | IsNumericRule
  | EmailRule
  | CustomRule
  | OneOfRule<Array<string | Reference>>;
export type StringSchema<TRule extends StringRules = StringRules> = BaseSchema<
  string,
  typeof SchemaType.STRING,
  TRule
> &
  PrivateSchema & { coerce?: boolean };

/**
 * STRING DATE SCHEMA
 */
export type DateStringRules =
  | MinRule<DateString | Reference>
  | MaxRule<DateString | Reference>
  | AfterRule<DateString | Reference>
  | BeforeRule<DateString | Reference>
  | EqualsRule<DateString | Reference>
  | RegexRule
  | CustomRule
  | OneOfRule<Array<DateString | Reference>>;

export type DateStringSchema<
  TFormat extends string = string,
  TRule extends DateStringRules = DateStringRules,
> = BaseSchema<DateString, typeof SchemaType.DATE_STRING, TRule> &
  PrivateSchema & {
    /*
     * Unicode Tokens
     * @see https://github.com/date-fns/date-fns/blob/main/docs/unicodeTokens.md
     * @see https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     *
     * @default 'yyyy-MM-dd'
     */
    format: TFormat;
  };

/**
 * OPTIONS SCHEMA
 */
export type OptionsRules = EqualsRule | CustomRule;
export type OptionsSchema<TValue extends string | number = string | number> = BaseSchema<
  TValue,
  typeof SchemaType.OPTIONS,
  OptionsRules
> & {
  options: TValue[];
};

/**
 * FILE SCHEMA
 */
// TODO: Add mime type rule
export type FileRules = MinRule | MaxRule | MimeTypeRule;
export type FileSchema<TValue extends string | number = string | number> = BaseSchema<
  TValue,
  typeof SchemaType.FILE,
  FileRules
>;

/**
 * OBJECT SCHEMA
 */
export type ObjectRules = CustomRule | MinRule<number> | MaxRule<number>;
export type ObjectSchema<T extends Record<string, Schema>> = BaseSchema<
  [T] extends [never] ? Record<string, unknown> : { [A in keyof T]: SchemaValuesInternal<T[A]> },
  typeof SchemaType.OBJECT,
  ObjectRules
> & {
  fields: [T] extends [never] ? Record<string, Schema> : T;
};

/**
 * ARRAY SCHEMA
 */
export type ArrayRules = MinRule<number> | MaxRule<number> | CustomRule;
export type ArraySchema<T extends Schema> = BaseSchema<
  [T] extends [never] ? unknown[] : SchemaValuesInternal<T>[],
  typeof SchemaType.ARRAY,
  ArrayRules
> & {
  schema: [T] extends [never] ? Schema : T;
  coerce?: boolean;
};

/**
 * NUMBER SCHEMA
 */
export type NumberRules =
  | MinRule<number | Reference>
  | MaxRule<number | Reference>
  | MaxPrecisionRule
  | EqualsRule<number | Reference>
  | CustomRule
  | OneOfRule<Array<number | Reference>>;
export type NumberSchema = BaseSchema<number, typeof SchemaType.NUMBER, NumberRules> & {
  coerce?: boolean;
};

/**
 * BOOLEAN SCHEMA
 */
export type BooleanRules = EqualsRule<boolean | Reference> | CustomRule;
export type BooleanSchema = BaseSchema<number, typeof SchemaType.BOOLEAN, BooleanRules> & {
  coerce?: boolean;
};

export type Schema =
  | StringSchema
  | ObjectSchema<never>
  | NumberSchema
  | BooleanSchema
  | ArraySchema<never>
  | DateStringSchema
  | OptionsSchema<string | number>
  | FileSchema;

export type SchemaWithParent<T extends Schema = Schema> = T & {
  parent?: Schema;
  parentValue?: unknown;
};

// === Field State Helpers ===
export type IsIncluded<T extends Schema> = T extends { included: true }
  ? true
  : T extends { included: false }
    ? false
    : // required is conditionally
      T["included"] extends object
      ? false
      : true; // default included

export type IsRequired<T extends Schema> = T extends { required: true }
  ? true
  : T extends { required: false }
    ? false
    : // required is conditionally
      T["required"] extends object
      ? false
      : true; // default required

export type IsPrivate<T extends Schema> = T extends { private: true } ? true : false;

// === Computed Properties ===
export type IsMandatory<T extends Schema> = IsIncluded<T> extends true ? IsRequired<T> : false;

export type IsOptionalField<T extends Schema> = IsMandatory<T> extends false ? true : false;

// === Value Transformers ===
export type MakeOptional<T extends Schema, V> = IsOptionalField<T> extends true ? V | undefined : V;

export type ApplyPrivacyMask<T extends Schema, V> = IsPrivate<T> extends true ? PrivateValue<V> : V;

// === Base Value Types ===
export type ValueType<T extends SchemaType = SchemaType> = T extends typeof SchemaType.STRING
  ? string
  : T extends typeof SchemaType.DATE_STRING
    ? DateString
    : T extends typeof SchemaType.DATE
      ? Date
      : T extends typeof SchemaType.NUMBER
        ? number
        : T extends typeof SchemaType.OBJECT
          ? Record<string, unknown>
          : T extends typeof SchemaType.ARRAY
            ? unknown[]
            : T extends typeof SchemaType.BOOLEAN
              ? boolean
              : T extends typeof SchemaType.OPTIONS
                ? string | number
                : T extends typeof SchemaType.FILE
                  ? File
                  : never;

// === Object Field Categorization ===
type OptionalFields<T extends ObjectSchema<never>> = {
  [K in keyof T["fields"] as IsOptionalField<T["fields"][K]> extends true ? K : never]?: SchemaValuesInternal<
    T["fields"][K]
  >;
};

type RequiredFields<T extends ObjectSchema<never>> = {
  [K in keyof T["fields"] as IsOptionalField<T["fields"][K]> extends false ? K : never]-?: SchemaValuesInternal<
    T["fields"][K]
  >;
};

export type ObjectValue<T extends ObjectSchema<never>> = OptionalFields<T> & RequiredFields<T>;

// === Main SchemaValues Type ===
export type SchemaValuesInternal<T extends Schema> = T extends StringSchema
  ? MakeOptional<T, ValueType<T["type"]>>
  : T extends DateStringSchema
    ? MakeOptional<T, ValueType<T["type"]>>
    : T extends NumberSchema
      ? MakeOptional<T, ValueType<T["type"]>>
      : T extends ObjectSchema<never>
        ? Prettify<ObjectValue<T>>
        : T extends BooleanSchema
          ? MakeOptional<T, ValueType<T["type"]>>
          : T extends OptionsSchema
            ? MakeOptional<T, Flatten<T["options"]>>
            : T extends FileSchema
              ? MakeOptional<T, ValueType<T["type"]>>
              : T extends ArraySchema<never>
                ? MakeOptional<T, Array<SchemaValuesInternal<T["schema"]>>>
                : never;

export type SchemaValues<T extends Schema> = Prettify<ApplyPrivacyMask<T, SchemaValuesInternal<T>>>;
/***
 * RESOLVED SCHEMA
 */
export type ResolvedRules<T extends Rule = Rule> = Exclude<T, ConditionalRule<Condition, T>>;

/**
 * CONTEXT
 * being used in resolving and / or validation
 */
export type Context<T extends Schema = Schema> = {
  type: "validate";
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

export const ErrorCode = {
  ...RuleType,
  IMMUTABLE: "immutable",
  INCLUDED: "included",
  REQRUIED: "required",
  TYPE: "type",
} as const;

export type ErrorCode = EnumValues<typeof ErrorCode>;

export type BaseErrorMessage<T = unknown, A = unknown, S extends Schema = Schema> = {
  /**
   * Defaults to the type safe code, but can be overwritten by
   * adding the code property to a rule
   */
  customCode: string;
  path: string;
  message: string;
  schema: S;
  value: T;
  current: A;
};

//RuleType
export type EqualsErrorMessage<T = unknown> = BaseErrorMessage & {
  code: typeof ErrorCode.EQUALS;
  equals: T;
};

export type MimeTypeErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MIME_TYPE;
  mimeType: string | string[];
};

export type MinErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MIN;
  min: number | string;
};

export type MaxErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MAX;
  max: number | string;
};

export type BeforeErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.BEFORE;
  before: string;
};

export type AfterErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.AFTER;
  after: string;
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

export type EmailErrorMEssage = BaseErrorMessage & {
  code: typeof ErrorCode.EMAIL;
};

export type RegexErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.REGEX;
  regex: string;
};

export type OneOfErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.ONE_OF;
  expected: Array<ValueType>;
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

export type ErrorMessage =
  | EqualsErrorMessage
  | MimeTypeErrorMessage
  | MinErrorMessage
  | MaxErrorMessage
  | MaxPrecisionErrorMessage
  | RegexErrorMessage
  | ImmutableErrorMessage
  | IncludedErrorMessage
  | RequiredErrorMessage
  | TypeErrorMessage
  | DateStringTypeErrorMessage
  | IsNumericErrorMessage
  | CustomErrorMessage
  | EmailErrorMEssage
  | OneOfErrorMessage
  | BeforeErrorMessage
  | AfterErrorMessage;

export type ValidationErrorResult = {
  success: false;
  errors: ErrorMessage[];
};

export type PlainPrivateValue<T> = {
  state: "plain";
  value?: T | undefined;
};

export type MaskedPrivateValue = {
  state: "masked";
  value: string;
};

export type PrivateValue<T> = PlainPrivateValue<T> | MaskedPrivateValue;

export type ValidationResult<T> = ValidationSuccesResult<T> | ValidationErrorResult;

export type SchemaWithValue<T extends Schema = Schema> = {
  value: ValueType<T["type"]>;
  schema: T;
};

export type CustomRuleFunction<
  TSchema extends Schema = Schema,
  TParams extends Record<string, unknown> = Record<string, unknown>,
> = (
  value: SchemaWithValue<TSchema>,
  params: TParams,
  path: string,
  schema: Schema
) => boolean | { success: false; [key: string]: JsonPrimitive };

export type CustomRuleMap = Record<string, CustomRuleFunction>;

export type ValidateOptions<TCustomRuleMap extends CustomRuleMap = CustomRuleMap> = {
  customRules?: TCustomRuleMap;

  /**
   * Whether or not to strip not included fields.
   * Defaults to `false`
   *
   * If set to true it will strip the included fields from the values
   * result instead of returning an 'included' error
   */
  stripNotIncludedValues?: boolean;
};
