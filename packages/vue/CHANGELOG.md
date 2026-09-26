# @dynz/vue

## 1.0.0

### Minor Changes

- a1a59b1: Fixed: a `ref()` to a discriminated union's discriminator (e.g. `ref("$.options.0.type")`)
  always resolved to `undefined`, so every predicate built on it was `false`. The
  discriminator had no schema of its own, so path lookups returned the union and the value
  failed its type check.

  `getNested`, `findSchemaByPath` and `findPossibleSchemasByPath` now resolve a
  discriminator path to an options schema listing every member's discriminator value. The
  same object is returned for every lookup of the same union.

  As a result `useOptions` works on a discriminator path and returns the variant choices,
  following ancestor unions as they switch. `useDiscriminatedUnionKeyValues` is removed from
  `@dynz/react-hook-form` and `@dynz/vue`: call `useOptions("<union>.<key>")` instead.

- b33b5d0: Private fields now work end to end: the server masks them, the form shows the mask, untouched fields go back as their mask marker, and `validate` swaps the stored value back in.
  - New `maskPrivateValues(schema, values, { maskers })` for the server → client payload. `setPrivate({ mask: "last4" })` names a masker (the schema stays serializable); `setPrivate(true)` uses `"***"`.
  - `validate(schema, currentValues, input)` resolves each masked value to the stored value, so `result.values` is a plain document ready to persist. A masked value with nothing stored fails with the new `masked` error code. Without `currentValues` (client side), masked values are skipped and passed through.
  - A raw value is now accepted for a private field (treated as `plain(value)`).
  - `ref()`s and conditions see a private field's plain value.
  - Errors never contain a private field's value: `value`/`current` are cleared and the value is scrubbed from the message.
  - New `toFormValues` / `toSubmitValues` helpers. `@dynz/react-hook-form` and `@dynz/vue` apply them automatically when you pass the masked payload as `currentValues`.
  - `@dynz/to-json-schema`: private fields are wrapped only in `"input"` mode (now also accepting the raw value); `"output"` mode emits the plain schema.
  - Fixed: `mask(0)` / `mask("")` passed `undefined` to the mask function.
  - `isPivateValue` is renamed to `isPrivateValue` (the old name is kept as a deprecated alias).

  **Behaviour changes for private fields.** The previous behaviour could not be used in practice: an omitted optional private field threw, and nested private fields were mistyped. Still, note:
  - `SchemaValues<T>` is now plain (no `PrivateValue` wrapper). Use the new `SchemaInput<T>` for submissions.
  - `currentValues` are plain stored values. Wrapped `plain(x)` values are still accepted at runtime.
  - `setPrivate` is only available on leaf schemas. Objects, arrays, discriminated unions and expressions can no longer be private.

- 27fb29b: Add `@dynz/vue`, the Vue 3 integration for dynz.

  Standalone first: `useDynzForm` gives you reactive values, validation and per-field state with no form-library dependency. Because Vue tracks reads automatically, the condition composables (`useIsRequired`, `useIsIncluded`, `useIsMutable`, `useOptions`, `usePredicate`) are plain `computed`s over dynz' resolvers — no dependency collection needed, and excluded ancestors are handled for free.

  Also ships `useDynzField` plus the renderless `DynzField`, `IsIncluded` and `When` components, and `dynzTypedSchema` for teams already using VeeValidate.

- ba6cc88: `@dynz/vue` no longer ships its own form-state engine — `useDynzForm`/`useDynzField` are now thin wrappers around vee-validate's real `useForm`/`useField`, mirroring how `@dynz/react-hook-form` wraps react-hook-form. `vee-validate` moves from an optional `devDependency` (used only by the standalone `dynzTypedSchema` adapter) to a required `peerDependency`.

  Breaking changes:
  - **`form.values` is read-only.** Mutate it through `form.setFieldValue(name, value)` (or the other vee-validate `FormActions`, all still spread onto `useDynzForm`'s return) — direct assignment (`form.values.foo = "bar"`) silently no-ops, which is vee-validate's own contract, not something this package can relax.
  - **Renamed to match vee-validate**: `reset` → `resetForm`, `setValue`/`setTouched`/`setError` → `setFieldValue`/`setFieldTouched`/`setFieldError`, `clearErrors` → `setErrors({...})` (there is no "wipe everything" shorthand — pass `undefined` for each field you want cleared).
  - **Removed, no replacement**: `rawErrors` and the top-level `touched` record. Per-field touched state comes from `useDynzField(name).isTouched` (or vee-validate's own `form.isFieldTouched(name)`), same as `@dynz/react-hook-form`.
  - **`validateField`'s cross-field error healing is now vee-validate's own `'validated-only'` behavior**, not custom scoping logic — it only holds for fields with a mounted `DynzField`/`useDynzField` (or any `useField`); a field validated purely at the form level with nothing rendering it always gets its error written immediately, regardless of "touched" state.
  - **`DynzFieldAdapter`, `useDynzFieldAdapter`, `setByPath`, `isPathWithin`, `normalizeDependencyName`, `cloneValues`** are gone — they backed the deleted custom engine.

  Not changed: `DynzField`, `When`, `IsIncluded`, and every condition composable (`useIsRequired`, `useIsIncluded`, `useIsMutable`, `useOptions`, `usePredicate`) keep their exact public shape — they only ever read `context.getValues()`/`context.schema`, so they work unchanged against vee-validate's reactive `values`.

### Patch Changes

- a1a59b1: Fix `findSchemaByPath` resolving the wrong member of a discriminated union

  `findSchemaByPath` had no document to read, so at a discriminated union it returned the
  first member that happened to declare the requested field. For an array of unions this
  meant `$.items[0].amount` and `$.items[1].amount` resolved to the same schema no matter
  which variant each element actually was — silently, with no error.

  It now accepts the values the path is resolved against, and narrows the union to the
  member the document selects:

  ```ts
  findSchemaByPath("$.items[0].amount", schema, { values });
  findSchemaByPath("$.items[0].amount", schema, SchemaType.STRING, values);
  ```

  Values are a tie-breaker, not a filter: a path naming a field the selected member does
  not declare still resolves by scanning the other members, because adapters keep the
  outgoing variant's fields mounted for a render while a discriminator changes. A missing
  or wrong-shaped value never throws — it just stops narrowing.

  Calling without values is unchanged and still resolves to the first member declaring the
  field, so nothing breaks; pass values wherever you have them.

  Also adds `findPossibleSchemasByPath(path, schema)`, returning every schema a path could
  resolve to — one per reachable union member. Dependency collection needs this rather than
  narrowing: the set of fields to watch has to stay stable across a discriminator flip,
  since noticing that flip is what the watch is for. `getConditionDependencies` and
  `useConditionalProperty` now use it, fixing watches that previously missed a condition
  declared solely on a non-first variant.

  `useDynzField`, `useOptions` and `getOptions` now resolve against live values, so a field inside a union sees its own variant's schema.

  Resolving against values also means the resolved schema is a function of the union's
  discriminator, so the react-hook-form hooks now watch it. `useOptions` previously had no
  such watch and would render the outgoing variant's options after a variant switch; `useDynzField` was already covered by
  the `included`/`required`/`mutable` watches. The Vue composables track it automatically
  through `computed`.

- 84a8799: Added `getOptions(name, schema, values)` and `getOptionsForSchema(schema, path, rootSchema, values)` to `dynz` — the framework-agnostic core of what each integration's `useOptions` hook/composable does: resolving an `options()` field's entries into `{ value, enabled }` pairs, where a dynamic entry's `enabled` predicate is resolved against `values`.

  ```ts
  getOptions("plan", schema, { hasSubscription: false });
  // [
  //   { value: "free", enabled: true },
  //   { value: "pro", enabled: false },
  // ]
  ```

  `@dynz/vue`'s `useOptions` now delegates to `getOptionsForSchema`, fixing a bug where a dynamic option's `enabled` predicate always resolved relative refs (`ref(...)`) against the schema root instead of the options field's own position — wrong for any options field nested inside an `object({...})`/`array(...)`, since a relative ref inside that predicate is meant to resolve against its siblings.

  `@dynz/react-hook-form`'s `useOptions`/`useOptionsSchema` (already correct) now delegate to the same shared helper instead of duplicating the resolution logic — no behavior change.

- Updated dependencies [f493c66]
- Updated dependencies [a1a59b1]
- Updated dependencies [f493c66]
- Updated dependencies [a1a59b1]
- Updated dependencies [f493c66]
- Updated dependencies [cb1ab83]
- Updated dependencies [84a8799]
- Updated dependencies [1cbf2fc]
- Updated dependencies [1cbf2fc]
- Updated dependencies [f493c66]
- Updated dependencies [b33b5d0]
- Updated dependencies [d2e3e68]
  - dynz@1.2.0
