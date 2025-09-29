import { toNestErrors, validateFieldsNatively } from "@hookform/resolvers";
import { type ErrorMessage, type ObjectSchema, type SchemaValues, type ValidateOptions, validate } from "dynz";
import { appendErrors, type FieldError, type FieldValues, type Resolver } from "react-hook-form";

type MessageTransformerFunc = (errorMessage: ErrorMessage) => string;

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

export function dynzResolver<T extends ObjectSchema<never>, O extends SchemaValues<T>, I extends FieldValues, C>(
  schema: T,
  currentValues?: O,
  schemaOptions?: ValidateOptions,
  resolverOptions: {
    messageTransformer?: MessageTransformerFunc;
    mode?: "async" | "sync";
    raw?: boolean;
  } = {}
): Resolver<I, C, O> {
  return async (values, _, options) => {
    // @ts-expect-error -- cast to unknown
    const result = validate(schema, currentValues as unknown, values, schemaOptions);

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
