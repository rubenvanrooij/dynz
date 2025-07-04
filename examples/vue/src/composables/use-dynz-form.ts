import { toTypedSchema } from '@dynz/veevalidate/index';
import { SchemaType, type ObjectSchema, type SchemaValues } from 'dynz/types';
import { useForm } from 'vee-validate';
import { provide } from 'vue';

export function useDynzForm<T extends ObjectSchema<never>>(
  schema: T,
  initialValues?: SchemaValues<T>,
) {
  const form = useForm<SchemaValues<T>>({
    validationSchema: toTypedSchema(schema, initialValues),
  });

  const setDefaultValues = (
    schema: ObjectSchema<never>,
    values: any,
    path: string = '$',
  ) => {
    Object.entries(schema.fields).forEach(([key, field]) => {
      const resolvedPath = path ? `${path}.${key}` : key;

      if (field.type === SchemaType.OBJECT) {
        setDefaultValues(field, values[key] || {}, resolvedPath);
      } else if (
        !form.isFieldTouched<any>(resolvedPath) &&
        values[key] === undefined &&
        field.default !== undefined
      ) {
        form.setFieldValue<any>(resolvedPath, field.default, false);
      } else if (
        field.included &&
        field.type === SchemaType.OPTION &&
        values[key] !== undefined &&
        !field.options.some(
          (option) =>
            option === values[key] ||
            (typeof option === 'object' && option.value === values[key]),
        )
      ) {
        // If the field is an option field and the value is not included in the options, set it back to the default value
        setFieldValue(resolvedPath, field.default, false);
      }
    });
  };

  provide('SCHEMA', schema);

  return form;
}
