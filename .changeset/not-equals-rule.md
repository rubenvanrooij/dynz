---
"dynz": minor
"@dynz/to-json-schema": patch
---

Added a `notEquals(value, code?)` rule, the inverse of `equals()`, to `string()`, `number()`, `boolean()`, `enum()`, and `options()` schemas. Like `equals()`, the expected value can be a static value or a `ref()` to another field.

```ts
string().notEquals(v("banned"));
string().notEquals(ref("oldPassword")); // new password must differ from the old one
```

`@dynz/to-json-schema` converts a static `notEquals` rule to `{ not: { const: value } }`.
