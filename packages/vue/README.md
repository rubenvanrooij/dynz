# `@dynz/vue`

Vue 3 integration for [dynz](https://npmjs.com/package/dynz). One schema describes your validation rules, your cross-field conditions (`required` / `included` / `mutable`) and your options — and this package turns that schema into reactive form state.

- 🎯 **Type-safe** — values, errors and conditions are inferred from the schema
- 🔄 **Cross-field validation** — reference other fields in rules and conditions
- 📐 **Conditional fields** — show, require and freeze fields based on other values
- 🪶 **No runtime dependencies** — `vue` and `dynz` are peer dependencies
- 🤝 **Bring your own form library** — standalone by default, with a VeeValidate adapter in the box

## Why this is smaller than the React integration

React Hook Form keeps inputs uncontrolled, so `@dynz/react-hook-form` has to collect the dependencies of every condition by hand and feed them to `useWatch` just to re-render.

Vue tracks reads automatically. A condition is just a `computed` that calls dynz:

```ts
const isRequired = computed(() =>
  resolveProperty("required", `$.${name}`, true, { schema, values }),
);
```

`resolveProperty` reads `values.plan` while it resolves, Vue records that read, and the computed re-evaluates when `plan` changes. Because tracking is _dynamic_, the tricky case — a leaf field with no condition of its own whose **ancestor** becomes excluded — works without any extra wiring.

## Installation

```bash
npm install @dynz/vue dynz vue
```

## Quick start (standalone)

```vue
<script setup lang="ts">
import { eq, object, options, ref, string } from "dynz";
import { DynzField, useDynzForm } from "@dynz/vue";

const schema = object({
  plan: options(["free", "pro", "enterprise"] as const),
  companyName: string()
    .min(1)
    .setIncluded(eq(ref("plan"), "enterprise")),
  slug: string().setMutable(false),
});

const { values, errors, handleSubmit } = useDynzForm({
  schema,
  initialValues: { plan: "free" },
  mode: "onBlur",
});

const onSubmit = handleSubmit((submitted) => console.log(submitted));
</script>

<template>
  <form @submit="onSubmit">
    <select v-model="values.plan">
      <option value="free">Free</option>
      <option value="pro">Pro</option>
      <option value="enterprise">Enterprise</option>
    </select>

    <!-- Renders nothing at all while the plan is not "enterprise" -->
    <DynzField
      name="companyName"
      v-slot="{ value, error, required, readOnly, onInput, onBlur }"
    >
      <input
        :value="value"
        :readonly="readOnly"
        :aria-required="required"
        @input="onInput"
        @blur="onBlur"
      />
      <span v-if="error">{{ error }}</span>
    </DynzField>

    <button type="submit">Save</button>
  </form>
</template>
```

## API

### `useDynzForm(options)`

Creates the form state and provides it to every descendant component.

| Option               | Description                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `schema`             | The dynz schema.                                                                              |
| `initialValues`      | Deeply partial starting values. Deep cloned, so your object is never mutated.                 |
| `currentValues`      | The persisted values. Passing these **enables mutability enforcement**.                       |
| `schemaOptions`      | Forwarded to dynz' `validate` (custom rules, `stripNotIncludedValues`, …).                    |
| `messageTransformer` | Rewrites error messages, e.g. through i18n.                                                   |
| `mode`               | When to validate before the first submit — `"onInput"`, `"onBlur"` or `"onSubmit"` (default). |
| `revalidateMode`     | When to validate after the first submit. Defaults to `"onInput"`.                             |
| `provideContext`     | Set to `false` to wire the returned `context` up yourself.                                    |

Returns `values` (reactive), `errors`, `rawErrors`, `touched`, `isValid`, `isSubmitting`, `isSubmitted`, `submitCount`, plus `validate`, `validateField`, `getValue`, `setValue`, `setTouched`, `setError`, `clearErrors`, `reset`, `handleSubmit`, `getDependencies` and `context`.

Error keys drop dynz' `$.` prefix and use bracket notation for arrays: `$.items.[0].name` → `items[0].name`.

#### `validateField(name)`

dynz always validates the document as a whole, so `validateField` scopes the _result_:

- errors on `name` (and anything nested under it) are refreshed;
- errors elsewhere disappear as soon as they are resolved — which is how a cross-field rule such as `equals(ref("password"))` heals itself;
- fields the user has not touched never gain a new error from someone else's keystroke.

### Components

| Component    | Renders                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DynzField`  | Renderless; passes value, error, required, readOnly and handlers to the default slot. Renders nothing while the field is excluded (pass `render-when-excluded` to override). |
| `IsIncluded` | Its slot, while `name` is included.                                                                                                                                          |
| `When`       | Its slot, while a predicate holds.                                                                                                                                           |

### Composables

| Composable                             | Returns                                                 |
| -------------------------------------- | ------------------------------------------------------- |
| `useDynzField(name)`                   | Value, error, touched state and the field's conditions. |
| `useIsRequired(name)`                  | `ComputedRef<boolean \| undefined>`                     |
| `useIsIncluded(name)`                  | `ComputedRef<boolean \| undefined>`                     |
| `useIsMutable(name)`                   | `ComputedRef<boolean \| undefined>`                     |
| `useOptions(name)`                     | `{ value, enabled }[]` for an options schema.           |
| `useDiscriminatedUnionKeyValues(name)` | `{ value, enabled }[]` for a discriminated union's key. |
| `usePredicate(predicate)`              | `ComputedRef<boolean \| undefined>`                     |
| `useDynzFormContext()`                 | The provided context.                                   |

All of these accept a plain string, a `ref`, or a getter, so the field name itself may be reactive. `useIsRequired`, `useIsIncluded` and `useIsMutable` also accept an array of names and then return an array of results.

> **Keep the tri-state.** These return `boolean | undefined`. Compare with `required !== false` and `mutable === false`; coercing with `!` collapses the "unresolved" signal into a wrong answer.

`useOptions` returns _every_ option with its resolved `enabled` flag, so a `<select>` can render disabled entries. Filter yourself if you only want the selectable ones. (This differs from `@dynz/react-hook-form`, which filters and returns values only.)

## VeeValidate

Already invested in VeeValidate? Let it own the form state and use dynz for validation and conditions. `dynzTypedSchema` is the direct analog of `@dynz/react-hook-form`'s `dynzResolver`.

```vue
<script setup lang="ts">
import { useForm } from "vee-validate";
import { dynzTypedSchema, provideDynzContext } from "@dynz/vue";

const form = useForm({
  validationSchema: dynzTypedSchema(schema, currentValues),
  initialValues: { plan: "free" },
});

// Opt the dynz condition composables in; they read VeeValidate's reactive values.
provideDynzContext({ schema, getValues: () => form.values });
</script>
```

Every composable in the table above then works unchanged, except `useDynzField` / `DynzField` — those need field state, which VeeValidate provides through its own `useField` and `Field`.

`dynzTypedSchema` also implements `describe()`, so VeeValidate's `meta.required` reflects your schema. Pass `getValues` in its fourth argument to have _conditional_ required resolved against the live values:

```ts
dynzTypedSchema(schema, currentValues, schemaOptions, {
  getValues: () => form.values,
});
```

## SSR / Nuxt

`provide`/`inject` and the async `validate` are SSR safe. Call `useDynzForm` inside `setup` so the reactive state is created per request — never at module scope.

## License

BUSL-1.1
