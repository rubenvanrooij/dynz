/**
 * A JSON Schema (2020-12) document. Loosely typed since the shape varies
 * significantly by keyword combination.
 */
export interface JsonSchema {
  $schema?: string;
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
}

export interface ConversionContext {
  readonly errorMode: ErrorMode;
  readonly mode: ConversionMode;
}
