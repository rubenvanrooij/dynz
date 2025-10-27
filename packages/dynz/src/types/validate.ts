import type {
  AfterRuleErrorMessage,
  BeforeRuleErrorMessage,
  CustomRuleErrorMessage,
  EmailRuleErrorMessage,
  EqualsRuleErrorMessage,
  IsNumericRuleErrorMessage,
  MaxDateRuleErrorMessage,
  MaxEntriesRuleErrorMessage,
  MaxLengthRuleErrorMessage,
  MaxPrecisionRuleErrorMessage,
  MaxRuleErrorMessage,
  MaxSizeRuleErrorMessage,
  MimeTypeRuleErrorMessage,
  MinDateRuleErrorMessage,
  MinEntriesRuleErrorMessage,
  MinLengthRuleErrorMessage,
  MinRuleErrorMessage,
  MinSizeRuleErrorMessage,
  OneOfRuleErrorMessage,
  RegexRuleErrorMessage,
} from "../rules";
import type { EnumValues } from "../schemas";
import type { BaseRule, ExtractResolvedRules } from "./rules";
import type { Schema, SchemaType, ValueType } from "./schema";
import type { ErrorMessageFromRule, JsonPrimitive } from "./utils";

export type ValidationSuccesResult<T> = {
  success: true;
  values: T;
};

export const ErrorCode = {
  IMMUTABLE: "immutable",
  INCLUDED: "included",
  REQRUIED: "required",
  TYPE: "type",
} as const;

export type ErrorCode = EnumValues<typeof ErrorCode>;

export type BaseErrorMessage<C = string, T = unknown, A = unknown, S extends Schema = Schema> = {
  /**
   * Defaults to the type safe code, but can be overwritten by
   * adding the code property to a rule
   */
  code: C;
  customCode: string;
  path: string;
  message: string;
  schema: S;
  value: T;
  current: A;
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

export type RulesErrorrMessages<T extends Schema = Schema> = T extends object ? ErrorMessageFromRule<T> : never;

export type ErrorMessage =
  | ImmutableErrorMessage
  | IncludedErrorMessage
  | RequiredErrorMessage
  | TypeErrorMessage
  | DateStringTypeErrorMessage
  | AfterRuleErrorMessage
  | BeforeRuleErrorMessage
  | CustomRuleErrorMessage
  | EmailRuleErrorMessage
  | EqualsRuleErrorMessage
  | IsNumericRuleErrorMessage
  | MaxDateRuleErrorMessage
  | MaxEntriesRuleErrorMessage
  | MaxLengthRuleErrorMessage
  | MaxPrecisionRuleErrorMessage
  | MaxRuleErrorMessage
  | MaxSizeRuleErrorMessage
  | MimeTypeRuleErrorMessage
  | MinDateRuleErrorMessage
  | MinEntriesRuleErrorMessage
  | MinLengthRuleErrorMessage
  | MinRuleErrorMessage
  | MinSizeRuleErrorMessage
  | OneOfRuleErrorMessage
  | RegexRuleErrorMessage;

export type ValidationErrorResult = {
  success: false;
  errors: ErrorMessage[];
};

export type ValidationResult<T> = ValidationSuccesResult<T> | ValidationErrorResult;

export type CustomRuleContext<T extends Schema, P extends Record<string, unknown>> = {
  value: ValueType<T["type"]>;
  schema: T;
  params: P;
  path: string;
  context: Context<T>;
};

export type CustomRuleFunction<
  T extends Schema = Schema,
  P extends Record<string, unknown> = Record<string, unknown>,
> = (context: CustomRuleContext<T, P>) => boolean | { success: false; [key: string]: JsonPrimitive };

export type CustomRuleMap<T extends CustomRuleFunction = CustomRuleFunction> = Record<string, T>;

export type ValidateOptions<TCustomRuleMap extends CustomRuleMap = CustomRuleMap> = {
  customRules?: TCustomRuleMap | undefined;

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

export type ResolveContext<T extends Schema = Schema> = {
  schema: T;
  values: {
    new: unknown;
  };
};

export type ErrorMessageForRule<T extends BaseRule> = Omit<T, "type"> & BaseErrorMessage<T["type"]>;

export type ValidateRuleContext<
  T extends Schema,
  R extends ExtractResolvedRules<T> = ExtractResolvedRules<T>,
> = R extends BaseRule
  ? {
      // type and ruleType needed for proper type narrowing
      type: T["type"];
      ruleType: R["type"];
      schema: T;
      path: string;
      rule: R;
      value: ValueType<T["type"]>;
      context: Context<T>;
    }
  : never;

//ExtractResolvedRules<T>

export type ValidateRuleContextUnion<T extends Schema> = T extends object
  ? ValidateRuleContext<T, ExtractResolvedRules<T>>
  : never;

export type OmitBaseErrorMessageProps<T extends BaseErrorMessage> = T extends BaseErrorMessage
  ? Omit<T, keyof Omit<BaseErrorMessage, "message" | "code">>
  : never;

export type RuleValidatorFn<TSchema extends Schema> = (
  context: ValidateRuleContextUnion<TSchema>
) => OmitBaseErrorMessageProps<ErrorMessageForRule<ExtractResolvedRules<TSchema>>> | undefined;

export type CombineUnion<T> = {
  [K in T extends object ? keyof T : never]: T extends Record<K, infer V> ? V : never;
};
