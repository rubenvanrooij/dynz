<template>
  <v-container class="fill-height" max-width="900">
    <DynzTextField path="name" label="Name" />
    <DynzTextField path="lastName" label="Last name" />
    <DynzDatestringField path="birthDate" label="Geboortedatum" />
  </v-container>
</template>

<script setup lang="ts">
import { useDynzForm } from '@/composables/use-dynz-form';
import DynzTextField from './dynz-text-field/dynz-text-field.vue';
import { dateString, object, string } from 'dynz/schema';
import { max, min } from 'dynz/rules';
import { eq } from 'dynz/conditions';

const schema = object({
  fields: {
    name: string({
      default: 'Jan',
      rules: [min(1), max(5)],
    }),
    lastName: string({
      included: eq('name', 'Jan'),
      default: 'Bar',
      rules: [max(2)],
    }),
    birthDate: dateString({
      required: true,
      rules: [min('2010-01-01')],
    }),
  },
});

useDynzForm(schema);
</script>
