---
"dynz": minor
---

Exposed `notOneOf(values, code?)`, the inverse of `oneOf()`, on `string()`, `number()`, `enum()`, and `options()` schemas. The `not_one_of` rule already existed internally (and was already handled by `@dynz/to-json-schema`, converting to `{ not: { enum: [...] } }`), but had no fluent method to create it.

```ts
string().notOneOf([v("admin"), v("root")]);
```
