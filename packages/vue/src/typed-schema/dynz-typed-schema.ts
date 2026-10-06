import { type ObjectSchema, type SchemaValues, type ValidateOptions, resolveProperty, validate } from "dynz";
import { type MessageTransformerFunc, toFieldErrorList } from "../errors";
import { toAbsolutePath } from "../utils";

/**
 * Structural copy of VeeValidate's `TypedSchema` contract (v4). Declared locally so
 * `vee-validate` stays an optional peer instead of a hard dependency; the shape is
 * asserted against the real type in `dynz-typed-schema.test.ts`.
 */
export type VeeValidateTypedSchemaError = {
  path?: string;
  errors: string[];
};

export type VeeValidateTypedSchemaResult<TOutput> = {
  value?: TOutput | undefined;
  errors: VeeValidateTypedSchemaError[];
};

export type VeeValidateTypedSchema<TInput, TOutput = TInput> = {
  __type: "VVTypedSchema";
  parse(values: TInput): Promise<VeeValidateTypedSchemaResult<TOutput>>;
  describe(path?: string): { required: boolean; exists: boolean };
};

export type DynzTypedSchemaOptions<TSchema extends ObjectSchema<never>> = {
  messageTransformer?: MessageTransformerFunc | undefined;

  /**
   * Lets `describe()` resolve conditional `required` against the live values, which is
   * what backs VeeValidate's `meta.required`. Without it, conditions are resolved
   * against an empty value set.
   */
  getValues?: (() => Partial<SchemaValues<TSchema>>) | undefined;
};

/**
 * The VeeValidate counterpart of `@dynz/react-hook-form`'s `dynzResolver`: turns a
 * dynz schema into a VeeValidate typed schema.
 *
 * ```ts
 * const { values } = useForm({
 *   validationSchema: dynzTypedSchema(schema, currentValues),
 *   initialValues,
 * });
 *
 * // Opt the dynz condition composables in as well:
 * provideDynzContext({ schema, getValues: () => values });
 * ```
 *
 * @param schema the dynz schema to validate against
 * @param currentValues the persisted values; passing them enables mutability enforcement
 * @param schemaOptions forwarded to dynz' `validate`
 */
export function dynzTypedSchema<TSchema extends ObjectSchema<never>>(
  schema: TSchema,
  currentValues?: SchemaValues<TSchema>,
  schemaOptions?: ValidateOptions,
  options: DynzTypedSchemaOptions<TSchema> = {}
): VeeValidateTypedSchema<SchemaValues<TSchema>> {
  return {
    __type: "VVTypedSchema",

    async parse(values) {
      const result = await validate(schema, currentValues, values, schemaOptions);

      if (result.success) {
        return { value: result.values, errors: [] };
      }

      return {
        value: undefined,
        errors: Object.entries(toFieldErrorList(result.errors, options.messageTransformer)).map(([path, errors]) => ({
          path,
          errors,
        })),
      };
    },

    describe(path) {
      if (path === undefined) {
        return { required: false, exists: true };
      }

      const context = { schema, values: options.getValues?.() ?? {} };

      try {
        return {
          required: resolveProperty("required", toAbsolutePath(path), true, context) !== false,
          exists: true,
        };
      } catch {
        // The path is not part of the schema — VeeValidate asks about fields it knows
        // of, which is not necessarily the same set the schema describes.
        return { required: false, exists: false };
      }
    },
  };
}
