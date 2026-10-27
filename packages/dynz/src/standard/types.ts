import type { Schema, SchemaValues } from "../types";

/**
 * The Standard Schema interface (v1), copied verbatim from
 * https://github.com/standard-schema/standard-schema as the spec recommends, so dynz
 * does not take a runtime or type dependency on `@standard-schema/spec`.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  /** The Standard Schema properties. */
  readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace StandardSchemaV1 {
  /** The Standard Schema properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1;
    /** The vendor name of the schema library. */
    readonly vendor: string;
    /** Validates unknown input values. */
    readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined;
  }

  /** The result interface of the validate function. */
  export type Result<Output> = SuccessResult<Output> | FailureResult;

  /** The result interface if validation succeeds. */
  export interface SuccessResult<Output> {
    /** The typed output value. */
    readonly value: Output;
    /** The non-existent issues. */
    readonly issues?: undefined;
  }

  /** The result interface if validation fails. */
  export interface FailureResult {
    /** The issues of failed validation. */
    readonly issues: ReadonlyArray<Issue>;
  }

  /** The issue interface of the failure output. */
  export interface Issue {
    /** The error message of the issue. */
    readonly message: string;
    /** The path of the issue, if any. */
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }

  /** The path segment interface of the issue. */
  export interface PathSegment {
    /** The key representing a path segment. */
    readonly key: PropertyKey;
  }

  /** The Standard Schema types interface. */
  export interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input;
    /** The output type of the schema. */
    readonly output: Output;
  }

  /** Infers the input type of a Standard Schema. */
  export type InferInput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["input"];

  /** Infers the output type of a Standard Schema. */
  export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["output"];
}

/**
 * Adds the `~standard` property to a schema type. The parameter is left unconstrained so
 * fluent builders can pass their generic schema shape; output is only computed once it
 * resolves to a concrete {@link Schema}. dynz does not transform values beyond
 * coercion, so input and output share the same type.
 */
export type WithStandard<TSchema> = StandardSchemaV1<StandardValues<TSchema>, StandardValues<TSchema>>;

/**
 * The `~standard` property type on its own. Fluent builder types declare it as a member
 * (rather than intersecting {@link WithStandard}) so they can reference themselves.
 */
export type StandardProps<TSchema> = WithStandard<TSchema>["~standard"];

type StandardValues<TSchema> = TSchema extends Schema ? SchemaValues<TSchema> : unknown;
