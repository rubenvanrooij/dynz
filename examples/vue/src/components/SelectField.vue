<script setup lang="ts">
import { DynzField, useOptions } from "@dynz/vue";

/**
 * A select driven entirely by the schema: `useOptions` resolves the option list —
 * including each option's conditional `enabled` flag — against the live form values,
 * so options enable and disable themselves as other fields change.
 */
const props = defineProps<{
  name: string;
  label: string;
  placeholder?: string;
  hint?: string;
}>();

const options = useOptions(() => props.name);
</script>

<template>
  <DynzField v-slot="{ value, error, required, readOnly, onInput, onBlur }" :name="name">
    <div class="field" :class="{ 'field--invalid': error !== undefined }">
      <label :for="name">
        {{ label }}<span v-if="required" class="required"> *</span>
      </label>
      <select
        :id="name"
        :value="value ?? ''"
        :disabled="readOnly"
        :aria-required="required"
        :aria-invalid="error !== undefined"
        @change="onInput"
        @blur="onBlur"
      >
        <option value="" disabled>{{ placeholder ?? "Choose…" }}</option>
        <option
          v-for="option in options"
          :key="String(option.value)"
          :value="option.value"
          :disabled="!option.enabled"
        >
          {{ option.value }}{{ option.enabled ? "" : " (unavailable)" }}
        </option>
      </select>
      <p v-if="hint !== undefined && error === undefined" class="hint">{{ hint }}</p>
      <p v-if="error !== undefined" class="error">{{ error }}</p>
    </div>
  </DynzField>
</template>
