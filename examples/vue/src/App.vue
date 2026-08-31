<script setup lang="ts">
import SubscribeToNewsletter from "./forms/SubscribeToNewsletter.vue";
</script>

<template>
  <main>
    <h1>Subscribe to the newsletter</h1>
    <p class="lede">
      Every conditional field, conditional requirement and disabled option below comes from a single
      <code>dynz</code> schema. Vue's reactivity keeps them in sync — <code>@dynz/vue</code> collects no dependencies
      of its own.
    </p>

    <SubscribeToNewsletter />
  </main>
</template>
