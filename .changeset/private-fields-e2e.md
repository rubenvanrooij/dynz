---
"dynz": minor
"@dynz/react-hook-form": minor
"@dynz/vue": minor
"@dynz/to-json-schema": minor
---

Private fields now work end to end: the server masks them, the form shows the mask, untouched fields go back as their mask marker, and `validate` swaps the stored value back in.

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
