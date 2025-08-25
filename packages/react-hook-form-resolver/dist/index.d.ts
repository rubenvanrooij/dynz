import { ObjectSchema, SchemaValues } from 'dynz/types';
import { type TypedSchema } from 'vee-validate';
/**
 * Transforms a Zod object schema to Yup's schema
 */
export declare function toTypedSchema<TSchema extends ObjectSchema<never>, TOutput = SchemaValues<TSchema>, TInput = unknown>(dynzSchema: TSchema, curentValues: SchemaValues<TSchema> | undefined): TypedSchema<TInput, TOutput>;
//# sourceMappingURL=index.d.ts.map