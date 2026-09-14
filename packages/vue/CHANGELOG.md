# @dynz/vue

## 1.0.0

### Minor Changes

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

  Not changed: `DynzField`, `When`, `IsIncluded`, and every condition composable (`useIsRequired`, `useIsIncluded`, `useIsMutable`, `useOptions`, `usePredicate`, `useDiscriminatedUnionKeyValues`) keep their exact public shape — they only ever read `context.getValues()`/`context.schema`, so they work unchanged against vee-validate's reactive `values`.

### Patch Changes

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
- Updated dependencies [f493c66]
- Updated dependencies [f493c66]
- Updated dependencies [cb1ab83]
- Updated dependencies [84a8799]
- Updated dependencies [f493c66]
- Updated dependencies [d2e3e68]
  - dynz@1.2.0
