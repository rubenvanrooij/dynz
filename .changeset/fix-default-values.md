---
"dynz": minor
---

Fix `.setDefault(...)` so it actually applies. Previously a schema's `default` was only ever consulted when a *different* field referenced it via `ref()` — the field itself never received its own default: a required field left empty still failed with `required`, and an optional field left empty simply had its key absent from `result.values`.

`validate()` now falls back to a schema's `default` whenever a value is left empty (`undefined` or `null`), before the `required` check runs. Concretely:

- A required field with a default, left empty, now validates successfully with the default in the output.
- An optional field with a default, left empty, now has the default in `result.values` instead of being absent.
- The default is validated against the field's own type and rules like any other value, so an invalid default (e.g. `string().min(5).setDefault("hi")`) now surfaces as a real error instead of being silently accepted.
- A `ref()` to an empty field now resolves to the exact same value the field's own validation produces — previously the two could disagree.
- `SchemaValues<T>` now treats a field with a static default as optional, matching the corrected runtime behavior.

Also fixed: a `date()` default now survives a schema having been through `serialize()` and `JSON.parse()` — the default is coerced back into a `Date` wherever it's used (both for the field's own validation and for `ref()` resolution), independent of the field's `coerce` flag. A default is authored by the schema, not supplied by a caller, so it's always safe to normalize.

Also fixed: `getNested`'s array-index fallback previously used the *array* schema's own default (which has no fluent setter and was therefore always `undefined` in practice) instead of the *item* schema's default when a specific array element was missing.
