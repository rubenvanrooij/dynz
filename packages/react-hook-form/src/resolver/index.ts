import { toNestErrors, validateFieldsNatively } from "@hookform/resolvers";
import {
  type ErrorMessage,
  type ObjectSchema,
  type SchemaInput,
  type SchemaValues,
  toSubmitValues,
  type ValidateOptions,
  validate,
} from "dynz";
import { appendErrors, type FieldError, type FieldValues, type Resolver } from "react-hook-form";

export type MessageTransformerFunc = (errorMessage: ErrorMessage) => string;

function parseDynzErrors(
  dynzErrors: ErrorMessage[],
  validateAllFieldCriteria: boolean,
  messageTransformer?: MessageTransformerFunc
) {
  const errors: Record<string, FieldError> = {};

  for (const error of dynzErrors) {
    const { path, message, code } = error;
    const _path = path.slice(2);
    const _message = messageTransformer ? messageTransformer(error) : message;

    if (!errors[_path]) {
      errors[_path] = {
        message: _message,
        type: code,
      };
    }

    if (validateAllFieldCriteria) {
      const types = errors[_path]?.types;
      const messages = types?.[code];

      errors[_path] = appendErrors(
        _path,
        validateAllFieldCriteria,
        errors,
        code,
        messages ? ([] as string[]).concat(messages as string[], _message) : message
      ) as FieldError;
    }
  }

  return errors;
}

/**
 * @param currentValues the values the form was loaded with. On the client this is the
 * masked payload from `maskPrivateValues`: untouched private fields are submitted as
 * their mask marker and skipped, edited ones are validated and submitted as plain.
 */
export function dynzResolver<T extends ObjectSchema<never>, O extends SchemaValues<T>, I extends FieldValues, C>(
  schema: T,
  currentValues?: SchemaInput<T>,
  schemaOptions?: ValidateOptions,
  resolverOptions: {
    messageTransformer?: MessageTransformerFunc;
    mode?: "async" | "sync";
    raw?: boolean;
  } = {}
): Resolver<I, C, O> {
  return async (values, _, options) => {
    // Form state holds raw values; wrap private fields for submission.
    const submitted = toSubmitValues(schema, values, currentValues);
    const result = await validate(schema, currentValues as SchemaValues<T> | undefined, submitted, schemaOptions);

    options.shouldUseNativeValidation && validateFieldsNatively({}, options);

    if (result.success === false) {
      return {
        values: {},
        errors: toNestErrors(
          parseDynzErrors(
            result.errors,
            !options.shouldUseNativeValidation && options.criteriaMode === "all",
            resolverOptions.messageTransformer
          ),
          options
        ),
      };
    }

    return {
      errors: {},
      values: result.values as O,
    };
  };
}
