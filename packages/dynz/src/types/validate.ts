import { type ExtractResolvedRules, type Rule, RuleType } from "./rules";
import type { Schema, SchemaType, ValueType } from "./schema";
import type { EnumValues, JsonPrimitive } from "./utils";

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
  min: Date | number | string;
};

export type MinDateErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MIN_DATE;
  min: Date;
};

export type MinLengthErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MIN_LENGTH;
  min: number;
};

export type MinSizeErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MIN_SIZE;
  min: number;
};

export type MinEntriesErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MIN_ENTRIES;
  min: number;
};

export type MaxErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MAX;
  max: Date | number | string;
};

export type MaxEntriesErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MAX_ENTRIES;
  max: number;
};

export type MaxDateErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MAX_DATE;
  max: Date;
};

export type MaxLengthErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MAX_LENGTH;
  max: number;
};

export type MaxSizeErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.MAX_SIZE;
  max: number;
};

export type BeforeErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.BEFORE;
  before: Date | string;
};

export type AfterErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.AFTER;
  after: Date | string;
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
  | MinDateErrorMessage
  | MinLengthErrorMessage
  | MinSizeErrorMessage
  | MinEntriesErrorMessage
  | MaxErrorMessage
  | MaxSizeErrorMessage
  | MaxDateErrorMessage
  | MaxLengthErrorMessage
  | MaxEntriesErrorMessage
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

export type ErrorMessageForRule<T extends Rule> = Extract<ErrorMessage, { code: T["type"] }>;

export type ValidateRuleContext<
  T extends Schema,
  R extends ExtractResolvedRules<T> = ExtractResolvedRules<T>,
> = R extends Rule
  ? {
      // type and ruleType needed for proper type narrowing
      type: T["type"];
      ruleType: R["type"];
      schema: T;
      path: string;
      rule: R;
      value: ValueType<T["type"]>;
      context: Context;
    }
  : never;

//ExtractResolvedRules<T>

export type ValidateRuleContextUnion<T extends Schema> = T extends object
  ? ValidateRuleContext<T, ExtractResolvedRules<T>>
  : never;

export type OmitBaseErrorMessageProps<T extends ErrorMessage> = T extends ErrorMessage
  ? Omit<T, keyof Omit<BaseErrorMessage, "message">>
  : never;

export type RuleValidatorFn<TSchema extends Schema> = (
  context: ValidateRuleContextUnion<TSchema>
) => OmitBaseErrorMessageProps<ErrorMessageForRule<ExtractResolvedRules<TSchema>>> | undefined;

export type CombineUnion<T> = {
  [K in T extends object ? keyof T : never]: T extends Record<K, infer V> ? V : never;
};
