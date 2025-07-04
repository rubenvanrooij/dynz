<template>
  <div v-if="included" style="width: 100%">
    <v-text-field
      v-model="value"
      :error-messages="errorMessage"
      :label="label"
    ></v-text-field>
  </div>
</template>

<script setup lang="ts">
import { useDynzField } from '@/composables/use-dynz-field';
import { SchemaType } from 'dynz/types';
import { computed } from 'vue';

const { path } = defineProps<{ path: string; label: string }>();

const { value, errorMessage, included } = useDynzField(path, SchemaType.STRING);

/**
 * Computed value for the text field
 */
const computedValue = computed({
  get: () => (value.value === undefined ? '' : value.value),
  set: (v: string) => {
    console.log('set..');
    value.value = v.length === 0 ? undefined : v;
  },
});
</script>
