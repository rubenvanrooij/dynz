<script setup>
import { toTypedSchema } from '@dynz/veevalidate/index';
import { max, min, regex } from 'dynz/rules';
import { object, string } from 'dynz/schema';
import { Form, Field, ErrorMessage } from 'vee-validate';
import FormTextInput from './form-text-input.vue';

// const schema = yup.object({
//   email: yup.string().required().email(),
//   password: yup.string().required().min(8),
// });

const schema = object({
  fields: {
    email: string({
      rules: [regex(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'email')],
    }),
    password: string({
      rules: [min(2), max(3)],
    }),
  },
});

function onSubmit(values) {
  // Submit values to API...
  alert(JSON.stringify(values, null, 2));
}
</script>
<template>
  <Form @submit="onSubmit" :valid :validation-schema="toTypedSchema(schema)">
    <FormTextInput path="email" placeholder="Email" />
    <Field name="email" type="email" />
    <ErrorMessage name="email" />
    <Field name="password" type="password" />
    <ErrorMessage name="password" />
    <button>Submit</button>
  </Form>
</template>
