import { ObjectSchema, Schema, SchemaValues } from 'dynz/types';
import { validate } from 'dynz/validate';
import { type TypedSchema, type TypedSchemaError } from 'vee-validate';

/**
 * Transforms a Zod object schema to Yup's schema
 */
export function toTypedSchema<
  TSchema extends ObjectSchema<never>,
  TOutput = SchemaValues<TSchema>,
  TInput = unknown,
>(
  dynzSchema: TSchema,
  curentValues: SchemaValues<TSchema> | undefined,
): TypedSchema<TInput, TOutput> {
  const schema: TypedSchema = {
    __type: 'VVTypedSchema',
    async parse(value) {
      const result = validate(dynzSchema, curentValues, value);

      // console.log(result);
      if (result.success) {
        return {
          value: result.values,
          errors: [],
        };
      }

      const errors = result.errors.reduce(
        (acc, { path, ...rest }) => {
          if (!acc[path]) {
            acc[path] = { errors: [], path: path.slice(2) };
          }

          acc[path].errors.push(rest.code);

          return acc;
        },
        {} as Record<string, TypedSchemaError>,
      );

      return {
        errors: Object.values(errors),
      };
    },
    cast(values) {
      console.log('cast..');
      return values;
    },

    // const defaultValues = dynzSchema.

    // cast(values) {
    //   console.log('cast..');
    //   return {
    //     name: 'Al',
    //     // }

    //     // try {
    //     //   return zodSchema.parse(values);
    //     // } catch {
    //     //   // Zod does not support "casting" or not validating a value, so next best thing is getting the defaults and merging them with the provided values.
    //     //   const defaults = getDefaults(zodSchema);
    //     //   if (isObject(defaults) && isObject(values)) {
    //     //     return merge(defaults, values);
    //     //   }

    //     //   return values;
    //   };
    // },
    // describe(path) {
    //   try {
    //     if (!path) {
    //       return {
    //         required: svSchema.required,
    //         exists: true,
    //       };
    //     }

    //     const description = getSchemaForPath(path, zodSchema);
    //     if (!description) {
    //       return {
    //         required: false,
    //         exists: false,
    //       };
    //     }

    //     return {
    //       required: !description.isOptional(),
    //       exists: true,
    //     };
    //   } catch {
    //     if (__DEV__) {
    //       console.warn(
    //         `Failed to describe path ${path} on the schema, returning a default description.`,
    //       );
    //     }

    //     return {
    //       required: false,
    //       exists: false,
    //     };
    //   }
    // },
  };

  return schema;
}
