import type {
  AfterRuleErrorMessage,
  BeforeRuleErrorMessage,
  CustomRuleErrorMessage,
  EmailRuleErrorMessage,
  EqualsRuleErrorMessage,
  IncludesRuleErrorMessage,
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
  NotIncludesRuleErrorMessage,
  OneOfRuleErrorMessage,
  RegexRuleErrorMessage,
} from "../rules";
import type { NotOneOfRuleErrorMessage } from "../rules/not-one-off-rule";
import type { EnumValues } from "../schemas";
import type { BaseRule, ExtractResolvedRules, MaybePromise } from "./rules";
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
  CIRCULAR_REF: "circular_ref",
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
  expectedType: SchemaType;
};

export type CircularRefErrorMessage = BaseErrorMessage & {
  code: typeof ErrorCode.CIRCULAR_REF;
  uri: string;
};

export type RulesErrorrMessages<T extends Schema = Schema> = T extends object ? ErrorMessageFromRule<T> : never;

export type ErrorMessage =
  | ImmutableErrorMessage
  | IncludedErrorMessage
  | RequiredErrorMessage
  | TypeErrorMessage
  | CircularRefErrorMessage
  | AfterRuleErrorMessage
  | BeforeRuleErrorMessage
  | CustomRuleErrorMessage
  | EmailRuleErrorMessage
  | EqualsRuleErrorMessage
  | IncludesRuleErrorMessage
  | NotIncludesRuleErrorMessage
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
  | NotOneOfRuleErrorMessage
  | RegexRuleErrorMessage;

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
) =>
  | Promise<boolean | { success: false; [key: string]: JsonPrimitive }>
  | boolean
  | { success: false; [key: string]: JsonPrimitive };

export type CustomRuleMap = Record<string, CustomRuleFunction>;

/**
 * Resolves a `schemaRef(uri)` node to the actual `Schema` it points to. dynz never
 * fetches a URI itself — no assumed transport, no built-in SSRF surface — so this must
 * be supplied by the consumer via `resolveSchemaRef`.
 */
export type SchemaRefResolver = (uri: string, context: SchemaRefResolveContext) => MaybePromise<Schema>;

export type SchemaRefResolveContext = {
  /** The absolute path (e.g. `$.participants.[2]`) where the ref was encountered. */
  path: string;
  /** URIs currently being resolved on this call's chain, for the resolver's own diagnostics. */
  stack: readonly string[];
};

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

  /**
   * Resolves `schemaRef(uri)` nodes encountered during validation. Required when the
   * schema contains one — validation throws if a `schema_ref` is reached without it.
   */
  resolveSchemaRef?: SchemaRefResolver;
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

  // current values
  currentValues: unknown;
  // new values
  values: unknown;

  /** URIs currently being resolved on the current recursion chain — detects cycles. */
  refStack: readonly string[];
  /** Per-`validate()`-call dedup: one resolver invocation per URI, however many refs use it. */
  refCache: Map<string, Promise<Schema>>;
  /**
   * Schemas resolved so far, keyed by the normalized path (dot-joined, no brackets) of
   * the `schema_ref` node itself — lets `getNested`'s ancestor-walk see through an
   * already-resolved ref when a conditional (`required`/`mutable`/`included`) on a field
   * nested inside it needs to be checked.
   */
  resolvedRefs: Map<string, Schema>;
};

export type ResolveContext<T extends Schema = Schema, A = unknown> = {
  schema: T;
  values: A;
  resolvedRefs?: Map<string, Schema>;
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
