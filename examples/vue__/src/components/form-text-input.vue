<script setup lang="ts">
import { useField } from 'vee-validate';
import { computed } from 'vue';

const {
  path,
  placeholder,
  emptyStringAsUndefined = true,
} = defineProps<{
  path: string;
  placeholder?: string;
  emptyStringAsUndefined?: boolean;
}>();

const { value: inputValue, handleBlur, errorMessage } = useField(path);

const value = computed({
  get() {
    return typeof inputValue.value === 'string' ? inputValue.value : '';
  },
  set(value: string) {
    inputValue.value = value === '' && emptyStringAsUndefined ? undefined : value;
  },
});
</script>
<template>
  <input type="text" @blur="handleBlur" :name="path" v-model="value" :placeholder="placeholder" />
  ??{{ errorMessage }}^^
</template>
