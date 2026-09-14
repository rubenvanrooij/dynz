---
"@dynz/vue": minor
---

`@dynz/vue` no longer ships its own form-state engine — `useDynzForm`/`useDynzField` are now thin wrappers around vee-validate's real `useForm`/`useField`, mirroring how `@dynz/react-hook-form` wraps react-hook-form. `vee-validate` moves from an optional `devDependency` (used only by the standalone `dynzTypedSchema` adapter) to a required `peerDependency`.

Breaking changes:

- **`form.values` is read-only.** Mutate it through `form.setFieldValue(name, value)` (or the other vee-validate `FormActions`, all still spread onto `useDynzForm`'s return) — direct assignment (`form.values.foo = "bar"`) silently no-ops, which is vee-validate's own contract, not something this package can relax.
- **Renamed to match vee-validate**: `reset` → `resetForm`, `setValue`/`setTouched`/`setError` → `setFieldValue`/`setFieldTouched`/`setFieldError`, `clearErrors` → `setErrors({...})` (there is no "wipe everything" shorthand — pass `undefined` for each field you want cleared).
- **Removed, no replacement**: `rawErrors` and the top-level `touched` record. Per-field touched state comes from `useDynzField(name).isTouched` (or vee-validate's own `form.isFieldTouched(name)`), same as `@dynz/react-hook-form`.
- **`validateField`'s cross-field error healing is now vee-validate's own `'validated-only'` behavior**, not custom scoping logic — it only holds for fields with a mounted `DynzField`/`useDynzField` (or any `useField`); a field validated purely at the form level with nothing rendering it always gets its error written immediately, regardless of "touched" state.
- **`DynzFieldAdapter`, `useDynzFieldAdapter`, `setByPath`, `isPathWithin`, `normalizeDependencyName`, `cloneValues`** are gone — they backed the deleted custom engine.

Not changed: `DynzField`, `When`, `IsIncluded`, and every condition composable (`useIsRequired`, `useIsIncluded`, `useIsMutable`, `useOptions`, `usePredicate`, `useDiscriminatedUnionKeyValues`) keep their exact public shape — they only ever read `context.getValues()`/`context.schema`, so they work unchanged against vee-validate's reactive `values`.
