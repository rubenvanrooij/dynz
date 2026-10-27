import type { ErrorMessage, Schema, SchemaValues, ValidateOptions } from "../types";
import { toPathSegments } from "../utils/path";
import { validate } from "../validate/validate";
import type { StandardSchemaV1, WithStandard } from "./types";

export type StandardSchemaOptions<T extends Schema> = ValidateOptions & {
  /**
   * The persisted values; passing them enables mutability enforcement, exactly like the
   * second argument of `validate`.
   */
  currentValues?: SchemaValues<T> | undefined;

  /** Maps a dynz error onto the issue message. Defaults to `error.message`. */
  messageTransformer?: ((error: ErrorMessage) => string) | undefined;
};

function toStandardProps<T extends Schema>(
  schema: T,
  { currentValues, messageTransformer, ...validateOptions }: StandardSchemaOptions<T> = {}
): StandardSchemaV1.Props<SchemaValues<T>> {
  return {
    version: 1,
    vendor: "dynz",
    async validate(value) {
      const result = await validate(schema, currentValues, value, validateOptions);

      if (result.success) {
        return { value: result.values };
      }

      return {
        issues: result.errors.map((error) => ({
          message: messageTransformer ? messageTransformer(error) : error.message,
          path: toPathSegments(error.path),
        })),
      };
    },
  };
}

function defineStandard<T extends object>(schema: T, props: StandardSchemaV1.Props<unknown, unknown>): T {
  // Non-enumerable, so `serialize`, object spreads and deep equality never see it.
  return Object.defineProperty(schema, "~standard", {
    value: props,
    enumerable: false,
    configurable: true,
    writable: false,
  });
}

/**
 * Attaches `~standard` to a freshly built fluent schema. Internal: builders call it on
 * the object they create, so it mutates in place.
 */
export function withStandard<T extends object>(schema: T): T {
  return defineStandard(schema, toStandardProps(schema as unknown as Schema));
}

/**
 * Turns any dynz schema into a [Standard Schema](https://standardschema.dev).
 *
 * Schemas built with the fluent builders already are one; use this for plain object or
 * deserialized schemas, or to pass options the spec's `validate(value)` has no room for:
 *
 * ```ts
 * const standard = standardSchema(schema, { currentValues, customRules });
 * await standard["~standard"].validate(input);
 * ```
 *
 * Returns a shallow copy; the given schema is left untouched.
 */
export function standardSchema<T extends Schema>(schema: T, options?: StandardSchemaOptions<T>): T & WithStandard<T> {
  return defineStandard({ ...schema }, toStandardProps(schema, options)) as T & WithStandard<T>;
}
