# @dynz/to-json-schema

## 0.1.0

### Minor Changes

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

- d2e3e68: Every schema builder now supports metadata via `.setMeta(...)` and `.describe(...)`:

  ```ts
  string()
    .setMeta({ id: "userName", title: "User name", deprecated: true })
    .describe("The user's display name");
  // schema.meta -> { id: "userName", title: "User name", deprecated: true, description: "The user's display name" }
  ```

  `.setMeta(...)` shallow-merges into any existing metadata (so `.describe(...)` after `.setMeta({ id })` keeps the `id`), and accepts arbitrary custom keys alongside the built-in `id`/`title`/`description`/`deprecated`.

  `@dynz/to-json-schema` now carries this metadata over into the generated JSON Schema: `title`, `description`, and `deprecated` map onto the same-named keywords, `id` maps to the standard `$id` keyword, and any custom keys pass through as-is.

- 836ade0: Added `strict` and `unionKeyword` options to `toStandardJsonSchema`, for compatibility with LLM structured-output "strict" modes (OpenAI `strict: true`, Anthropic's native structured output).

  **`strict`** (defaults to `true`): every object node gets `additionalProperties: false` and a complete `required` list — a property that isn't otherwise mandatory has its schema widened to also accept `null` (via `anyOf`), since strict mode has no other way to express "may be absent". `literal()` fields, and the discriminator key of a `discriminatedUnion()`, also get an inferred `type` (strict mode requires `type` everywhere).

  ```ts
  toStandardJsonSchema(object({ name: string(), age: number().optional() }));
  // {
  //   type: "object",
  //   additionalProperties: false,
  //   properties: { name: { type: "string" }, age: { anyOf: [{ type: "number" }, { type: "null" }] } },
  //   required: ["name", "age"],
  // }
  ```

  Since this changes the default output shape, pass `strict: false` to reproduce the previous (pre-this-release) output exactly.

  **`unionKeyword`** (defaults to `"oneOf"`): controls the keyword used for every schema-selection union this package emits — `discriminatedUnion()` members, and the plain/masked wrapper for `.setPrivate(true)` fields. Some strict-mode consumers (e.g. Anthropic's structured output) reject `oneOf` outright and require `anyOf` instead:

  ```ts
  toStandardJsonSchema(schema, { unionKeyword: "anyOf" });
  ```

### Patch Changes

- f493c66: A field with a static `default` is no longer listed in the generated JSON Schema's `required` array. Previously a required-by-default field with a `.setDefault(...)` was both required _and_ defaulted in the generated schema — a contradiction most JSON Schema / OpenAPI tooling reads as "omit me and this is what you get" vs. "you must supply me", and one that no longer matches `dynz`'s corrected runtime behavior (a static default now satisfies `required`).
- 1cbf2fc: Added a `notEquals(value, code?)` rule, the inverse of `equals()`, to `string()`, `number()`, `boolean()`, `enum()`, and `options()` schemas. Like `equals()`, the expected value can be a static value or a `ref()` to another field.

  ```ts
  string().notEquals(v("banned"));
  string().notEquals(ref("oldPassword")); // new password must differ from the old one
  ```

  `@dynz/to-json-schema` converts a static `notEquals` rule to `{ not: { const: value } }`.

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
