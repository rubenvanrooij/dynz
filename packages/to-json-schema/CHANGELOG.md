# @dynz/to-json-schema

## 0.1.0

### Minor Changes

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
- Updated dependencies [f493c66]
- Updated dependencies [f493c66]
- Updated dependencies [f493c66]
- Updated dependencies [cb1ab83]
- Updated dependencies [84a8799]
- Updated dependencies [f493c66]
- Updated dependencies [d2e3e68]
  - dynz@1.2.0
