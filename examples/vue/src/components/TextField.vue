<script setup lang="ts">
import { DynzField } from "@dynz/vue";

/**
 * A plain text input. It knows nothing about dynz — `DynzField` hands it the value,
 * the error and whether the schema currently considers the field required or frozen.
 */
defineProps<{
  name: string;
  label: string;
  type?: "text" | "email";
  placeholder?: string;
  hint?: string;
}>();
</script>

<template>
  <DynzField v-slot="{ value, error, required, readOnly, onInput, onBlur }" :name="name">
    <div class="field" :class="{ 'field--invalid': error !== undefined }">
      <label :for="name">
        {{ label }}<span v-if="required" class="required"> *</span>
      </label>
      <input
        :id="name"
        :type="type ?? 'text'"
        :value="value ?? ''"
        :placeholder="placeholder"
        :readonly="readOnly"
        :aria-required="required"
        :aria-invalid="error !== undefined"
        @input="onInput"
        @blur="onBlur"
      />
      <p v-if="hint !== undefined && error === undefined" class="hint">{{ hint }}</p>
      <p v-if="error !== undefined" class="error">{{ error }}</p>
    </div>
  </DynzField>
</template>
