import type { Schema } from 'dynz/types';
import { useField, useFormValues } from 'vee-validate';
import { computed, toValue, watch, type MaybeRefOrGetter, ref } from 'vue';
import { useDynzFormContext } from './use-dynz-form-context';
import { getNestedValue } from 'vuetify/lib/util/helpers.mjs';
import {
  findSchemaByPath,
  isIncluded,
  isMutable,
  isRequired,
} from 'dynz/resolve';
export function useDynzField<T extends Schema>(
  path: MaybeRefOrGetter<string>,
  type: T['type'],
) {
  const { schema, form } = useDynzFormContext();
  const field = useField(path);
  const fieldSchema = computed(() =>
    findSchemaByPath(`$.${toValue(path)}`, schema, type),
  );

  const values = ref(form.values);

  const f = useFormValues();

  watch(form.values, (newValues) => {
    console.log(
      'form values changed',
      `$.${toValue(path)}`,
      isIncluded(fieldSchema.value, `$.${toValue(path)}`, newValues),
    );
    values.value = newValues;
  });

  const foo = computed(() => {
    const a = values.value;
    console.log('foo', values);
    return values.value;
  });

  const included = computed(() => {
    console.log('included', fieldSchema.value);
    return isIncluded(schema, `$.${toValue(path)}`, foo.value);
  });

  // resolve stuff..
  const required = computed(
    () =>
      included.value && isRequired(schema, `$.${toValue(path)}`, values.value),
  );

  const mutable = computed(
    () =>
      included.value && isMutable(schema, `$.${toValue(path)}`, values.value),
  );

  return {
    ...field,
    schema: fieldSchema,
    required,
    included,
    mutable,
    type,
  };
}
