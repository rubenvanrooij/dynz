import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers';
import { ErrorMessage, Schema, SchemaValues, validate, ValidateOptions } from 'dynz';
import { FieldValues, Resolver, ResolverSuccess, ResolverError, appendErrors, FieldError } from 'react-hook-form';

type MessageTransformerFunc = (errorMessage: ErrorMessage) => string

function parseDynzErrors(dynzErrors: ErrorMessage[], validateAllFieldCriteria: boolean, messageTransformer?: MessageTransformerFunc) {
   const errors: Record<string, FieldError> = {};
  
   for(const error of dynzErrors) {

      const { path, message, code } = error
      const _path = path.slice(2);
      const _message = messageTransformer ? messageTransformer(error) : message

      if(!errors[_path]) {
        errors[_path] = {
          message: _message,
          type: code
        }
      } 

      if (validateAllFieldCriteria) {
        const types = errors[_path]?.types;
        const messages = types && types[code];

        errors[_path] = appendErrors(
          _path,
          validateAllFieldCriteria,
          errors,
          code,
          messages
            ? ([] as string[]).concat(messages as string[], _message)
            : message,
        ) as FieldError;
      }
    }

   return errors
}

export function dynzResolver<TSchema extends Schema>(
  schema: TSchema,
  currentValues?: SchemaValues<TSchema>,
  schemaOptions?: ValidateOptions,
  resolverOptions: {
    messageTransformer?: MessageTransformerFunc,
    mode?: 'async' | 'sync';
    raw?: boolean;
  } = {},
): Resolver<SchemaValues<TSchema>> {

    return async (values: FieldValues, _, options) => {
        const result = validate(schema, currentValues, values, schemaOptions)

        options.shouldUseNativeValidation &&
          validateFieldsNatively({}, options);

        console.log('Dynz reslver...')
        console.log(result)
        if(result.success === false) {
          return {
            values: {},
            errors: toNestErrors(parseDynzErrors(result.errors, !options.shouldUseNativeValidation &&
                  options.criteriaMode === 'all', resolverOptions.messageTransformer), options)
          } satisfies ResolverError;
        }

        return {
          errors: {},
          values: resolverOptions.raw ? values : result.values,
        } satisfies ResolverSuccess<FieldValues | SchemaValues<TSchema>>;
  }

}