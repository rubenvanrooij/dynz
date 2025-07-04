import { toTypedSchema } from '@dynz/veevalidate/index';
import type { ObjectSchema, SchemaValues } from 'dynz/types';
import { useForm, useFormContext, useFormValues } from 'vee-validate';
import { inject, provide } from 'vue';

export function useDynzFormContext<T extends ObjectSchema<never>>() {
  const form = useFormContext<SchemaValues<T>>();
  const values = useFormValues();
  const schema = inject<T>('SCHEMA');

  if (schema === undefined) {
    throw new Error(
      'No schema provided in the form context. Please ensure you are using useDynzForm to provide the schema.',
    );
  }

  return {
    form,
    values,
    schema,
  };
}
