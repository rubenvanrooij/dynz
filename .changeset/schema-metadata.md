---
"dynz": minor
"@dynz/to-json-schema": minor
---

Every schema builder now supports metadata via `.setMeta(...)` and `.describe(...)`:

```ts
string()
  .setMeta({ id: "userName", title: "User name", deprecated: true })
  .describe("The user's display name");
// schema.meta -> { id: "userName", title: "User name", deprecated: true, description: "The user's display name" }
```

`.setMeta(...)` shallow-merges into any existing metadata (so `.describe(...)` after `.setMeta({ id })` keeps the `id`), and accepts arbitrary custom keys alongside the built-in `id`/`title`/`description`/`deprecated`.

`@dynz/to-json-schema` now carries this metadata over into the generated JSON Schema: `title`, `description`, and `deprecated` map onto the same-named keywords, `id` maps to the standard `$id` keyword, and any custom keys pass through as-is.
