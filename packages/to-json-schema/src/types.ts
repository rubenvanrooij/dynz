/**
 * A JSON Schema (2020-12) document. Loosely typed since the shape varies
 * significantly by keyword combination.
 */
export interface JsonSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  deprecated?: boolean;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  const?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minProperties?: number;
  maxProperties?: number;
  pattern?: string;
  format?: string;
  multipleOf?: number;
  contentMediaType?: string;
  contains?: JsonSchema;
  not?: JsonSchema;
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  default?: unknown;
  [key: string]: unknown;
}

/**
 * The policy for handling schema kinds/rule values that cannot be
 * represented in JSON Schema.
 */
export type ErrorMode = "throw" | "warn" | "ignore";

/**
 * Whether the conversion targets the data a consumer sends in (`"input"`)
 * or the data dynz produces after validation (`"output"`). `expression`
 * schemas are computed/derived values that are never part of the input, so
 * in `"input"` mode they're silently removed from the generated schema; in
 * `"output"` mode they're included (using their best-effort mapping).
 */
export type ConversionMode = "input" | "output";

/**
 * The keyword used for a schema-selection union — `discriminatedUnion()`
 * members, and the plain/masked wrapper for `.setPrivate(true)` fields.
 */
export type UnionKeyword = "oneOf" | "anyOf";

export interface ConversionConfig {
  /**
   * Policy for handling unsupported/unresolvable rule values and schema
   * kinds. Defaults to `"warn"`.
   */
  errorMode?: ErrorMode;
  /**
   * Whether to convert for input or output data. Defaults to `"input"`.
   */
  mode?: ConversionMode;
  /**
   * Produces strict-mode-compatible output for LLM structured outputs
   * (OpenAI `strict: true`, Anthropic's native structured output): every
   * object node gets `additionalProperties: false` and a complete
   * `required` list — a property that isn't otherwise mandatory has its
   * schema widened to also accept `null` (via `anyOf`), since strict mode
   * has no other way to express "may be absent". `literal()` fields (and
   * the discriminator key of a `discriminatedUnion()`) also get an
   * inferred `type`, which strict mode requires everywhere. Defaults to
   * `true`.
   */
  strict?: boolean;
  /**
   * The keyword used for every schema-selection union this package emits
   * — `discriminatedUnion()` members, and the plain/masked wrapper for
   * `.setPrivate(true)` fields. Some strict-mode consumers (e.g.
   * Anthropic's structured output) reject `oneOf` outright and require
   * `anyOf`. Defaults to `"oneOf"`.
   */
  unionKeyword?: UnionKeyword;
}

export interface ConversionContext {
  readonly errorMode: ErrorMode;
  readonly mode: ConversionMode;
  readonly strict: boolean;
  readonly unionKeyword: UnionKeyword;
}
