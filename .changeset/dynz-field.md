---
"@dynz/react-hook-form": minor
---

Added `useDynzField(name)` and `<DynzField name render>` — the per-field wiring every consumer was otherwise hand-writing themselves (both of this repo's own example apps included): `useController` bound to the form's `control`, plus the schema's `included`/`required`/`mutable` state, the field's own schema, and automatic cross-field revalidation (`rules.deps`) for any field whose rules reference another.

```tsx
<DynzField
  name="companyName"
  render={({ field, fieldState, required, readOnly }) => (
    <>
      <input {...field} aria-required={required} readOnly={readOnly} />
      {fieldState.error && <span>{fieldState.error.message}</span>}
    </>
  )}
/>
```

`useDynzField` is the hook underneath, for consumers who want to build their own wrapper instead: `const { field, fieldState, formState, included, required, readOnly, schema } = useDynzField("companyName")`.

Also: `react` moves from a `devDependency` to a `peerDependency` — `DynzField` is the first component this package ships that returns JSX at runtime.
