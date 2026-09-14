---
"@dynz/to-json-schema": minor
---

Added `strict` and `unionKeyword` options to `toStandardJsonSchema`, for compatibility with LLM structured-output "strict" modes (OpenAI `strict: true`, Anthropic's native structured output).

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
