<script setup lang="ts">
import { DynzField } from "@dynz/vue";

/** `onInput` reads `checked` rather than `value` when the target is a checkbox. */
defineProps<{
  name: string;
  label: string;
  hint?: string;
}>();
</script>

<template>
  <DynzField v-slot="{ value, error, readOnly, onInput, onBlur }" :name="name">
    <div class="field" :class="{ 'field--invalid': error !== undefined }">
      <div class="checkbox">
        <input
          :id="name"
          type="checkbox"
          :checked="value === true"
          :disabled="readOnly"
          @input="onInput"
          @blur="onBlur"
        />
        <label :for="name">{{ label }}</label>
      </div>
      <p v-if="hint !== undefined && error === undefined" class="hint">{{ hint }}</p>
      <p v-if="error !== undefined" class="error">{{ error }}</p>
    </div>
  </DynzField>
</template>
