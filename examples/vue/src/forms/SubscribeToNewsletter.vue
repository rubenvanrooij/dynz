<script setup lang="ts">
import { When, useDynzForm } from "@dynz/vue";
import { eq, ref as dynzRef } from "dynz";
import { ref } from "vue";
import CheckboxField from "../components/CheckboxField.vue";
import SelectField from "../components/SelectField.vue";
import TextField from "../components/TextField.vue";
import { newsletterSchema } from "./newsletter-schema";

const submitted = ref<unknown>(undefined);

const { values, errors, isSubmitting, handleSubmit, reset } = useDynzForm({
  schema: newsletterSchema,
  initialValues: {
    frequency: "weekly",
    format: "html",
    wantsProductNews: false,
  },
  // Don't nag while someone is still filling the form in; once they have submitted
  // once, correct them as they type.
  mode: "onBlur",
  revalidateMode: "onInput",
  schemaOptions: { stripNotIncludedValues: true },
});

const onSubmit = handleSubmit((valid) => {
  submitted.value = valid;
});

function onReset() {
  submitted.value = undefined;
  reset();
}
</script>

<template>
  <div class="card">
    <form novalidate @submit="onSubmit">
      <div class="fields">
        <TextField name="email" label="Email" type="email" placeholder="you@example.com" />
        <TextField name="name" label="Name" placeholder="Ada Lovelace" />

        <SelectField name="frequency" label="How often?" />

        <SelectField
          name="format"
          label="Format"
          hint="The digest bundles a week of posts, so it is unavailable for daily subscribers."
        />

        <!-- `When` renders only while the predicate holds against the live values. -->
        <When :cond="eq(dynzRef('frequency'), 'daily')">
          <p class="note">
            Daily it is. The <strong>digest</strong> option disabled itself — the schema says so, no template logic
            required.
          </p>
        </When>

        <SelectField name="role" label="What do you do?" />

        <!-- Rendered only while `role` is "other"; the schema decides, not the template. -->
        <TextField name="roleDetails" label="Tell us more" placeholder="Data engineer, SRE, …" />

        <CheckboxField
          name="wantsProductNews"
          label="Also send me product news"
          hint="Turning this on makes 'Company' required and reveals the company size."
        />

        <TextField name="company" label="Company" placeholder="Acme Inc." />
        <SelectField name="companySize" label="Company size" />

        <div style="display: flex; gap: 0.5rem">
          <button type="submit" :disabled="isSubmitting">Subscribe</button>
          <button type="button" style="background: transparent; color: var(--muted)" @click="onReset">Reset</button>
        </div>
      </div>
    </form>

    <div v-if="submitted !== undefined" class="result">
      <h2>Subscribed</h2>
      <pre>{{ JSON.stringify(submitted, null, 2) }}</pre>
    </div>
  </div>

  <details class="debug">
    <summary>Live form state</summary>
    <pre>values  {{ JSON.stringify(values, null, 2) }}</pre>
    <pre>errors  {{ JSON.stringify(errors, null, 2) }}</pre>
  </details>
</template>
